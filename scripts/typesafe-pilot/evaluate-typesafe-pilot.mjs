#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  MAX_INPUT_BYTES,
  MAX_REQUESTS,
  MAX_REQUEST_INPUT_TOKENS,
  MODEL,
  PILOT_DIR,
  PROTOCOL_ID,
  PROTOCOL_REVISION,
  RESULT_DIR,
  PilotError,
  acquireRunLock,
  assertSafeLocalFile,
  buildCallPlan,
  buildRequest,
  readJsonLines,
  readSafeLocalFile,
  safeErrorCode,
  sha256,
  stableStringify,
  validatePriceConfig,
  writeJsonAtomically,
} from './protocol.mjs';
import { computeMetrics } from './metrics.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);

async function readStaticJson(filePath, code) {
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch {
    throw new PilotError(code);
  }
  try {
    return { text, value: JSON.parse(text) };
  } catch {
    throw new PilotError(code);
  }
}

async function readOutputJson(filePath, code) {
  const text = await readSafeLocalFile(filePath).catch(() => {
    throw new PilotError(code);
  });
  if (text === null) throw new PilotError(code);
  try {
    return JSON.parse(text);
  } catch {
    throw new PilotError(code);
  }
}

export async function evaluateFixedPilotFiles({
  pilotDirectory = PILOT_DIR,
  resultDirectory = RESULT_DIR,
} = {}) {
  const unlock = await acquireRunLock(resultDirectory);
  try {
    const priceSnapshotPath = path.join(resultDirectory, 'price-snapshot.json');
    const runMetadataPath = path.join(resultDirectory, 'run-metadata.json');
    const resultsPath = path.join(resultDirectory, 'results.jsonl');
    const attemptsPath = path.join(resultDirectory, 'attempts.jsonl');
    const metricsPath = path.join(resultDirectory, 'metrics.json');
    for (const filePath of [
      priceSnapshotPath,
      runMetadataPath,
      resultsPath,
      attemptsPath,
      metricsPath,
      metricsPath + '.tmp',
    ]) {
      await assertSafeLocalFile(filePath);
    }

    const runSummaryPath = path.join(resultDirectory, 'run-summary.json');
    await assertSafeLocalFile(runSummaryPath);
    const [stimuliFile, protocolFile, goldFile, baselineFile, permutationFile, priceFile] = await Promise.all([
      readStaticJson(path.join(pilotDirectory, 'stimuli-only.json'), 'INVALID_STIMULI'),
      readStaticJson(path.join(pilotDirectory, 'protocol.json'), 'INVALID_PROTOCOL'),
      readStaticJson(path.join(pilotDirectory, 'gold.json'), 'GOLD_NOT_ADJUDICATED'),
      readStaticJson(path.join(pilotDirectory, 'agent-baseline.json'), 'AGENT_BASELINE_NOT_READY'),
      readStaticJson(path.join(pilotDirectory, 'permutation-plan.json'), 'INVALID_PERMUTATION_PLAN'),
      readStaticJson(path.join(pilotDirectory, 'price-config.json'), 'PRICE_CAP_NOT_CONFIGURED'),
    ]);
    const protocol = protocolFile.value;
    const stimuli = stimuliFile.value;
    const gold = goldFile.value;
    const baseline = baselineFile.value;
    const permutationPlan = permutationFile.value;
    const priceConfig = priceFile.value;

    if (!protocol
      || protocol.protocol_id !== PROTOCOL_ID
      || protocol.protocol_revision !== PROTOCOL_REVISION
      || protocol.model !== MODEL
      || ![
        'pending_v2_security_review',
        'ready_after_independent_review',
      ].includes(protocol.state)
      || sha256(stimuliFile.text) !== protocol.stimuli_sha256
      || sha256(goldFile.text) !== protocol.gold_sha256
      || sha256(baselineFile.text) !== protocol.agent_baseline_sha256
      || sha256(priceFile.text) !== protocol.price_config_sha256
      || sha256(permutationFile.text) !== protocol.permutation_plan_sha256) {
      throw new PilotError('PILOT_INPUT_HASH_MISMATCH');
    }

    const priceCheck = validatePriceConfig(priceConfig);
    const expectedMetadata = {
      version: 1,
      protocol_id: protocol.protocol_id,
      protocol_revision: protocol.protocol_revision,
      model: protocol.model,
      protocol_sha256: sha256(protocolFile.text),
      stimuli_sha256: protocol.stimuli_sha256,
      gold_sha256: protocol.gold_sha256,
      agent_baseline_sha256: protocol.agent_baseline_sha256,
      price_config_sha256: protocol.price_config_sha256,
      permutation_plan_sha256: protocol.permutation_plan_sha256,
      maximum_api_attempts_including_failures: MAX_REQUESTS,
      maximum_request_input_tokens: MAX_REQUEST_INPUT_TOKENS,
      maximum_request_body_bytes: MAX_INPUT_BYTES,
      maximum_run_usd: priceConfig.maximum_run_usd,
      worst_case_input_cost_usd: priceCheck.worst_case_input_cost_usd,
    };
    const [priceSnapshot, runMetadata, results, attempts, runSummary] = await Promise.all([
      readOutputJson(priceSnapshotPath, 'PRICE_SNAPSHOT_MISSING'),
      readOutputJson(runMetadataPath, 'RUN_METADATA_MISSING'),
      readJsonLines(resultsPath),
      readJsonLines(attemptsPath),
      readOutputJson(runSummaryPath, 'RUN_SUMMARY_MISSING'),
    ]);
    if (stableStringify(priceSnapshot) !== stableStringify(priceConfig)) {
      throw new PilotError('PRICE_SNAPSHOT_MISMATCH');
    }
    if (stableStringify(runSummary.run_metadata) !== stableStringify(runMetadata)) {
      throw new PilotError('RUN_METADATA_MISMATCH');
    }
    const planned = buildCallPlan(stimuli, permutationPlan);
    const expectedRequestHashes = new Map(planned.calls.map((call) => {
      const stimulus = planned.byId.get(call.stimulus_id);
      const request = buildRequest(stimulus, call.variant);
      return [call.stimulus_id + ':' + call.variant, sha256(request.bodyText)];
    }));
    for (const attempt of attempts) {
      if (expectedRequestHashes.get(attempt.attempt_id) !== attempt.request_sha256) {
        throw new PilotError('ATTEMPT_REQUEST_HASH_MISMATCH');
      }
    }
    const { created_at: createdAt, ...recordedMetadata } = runMetadata ?? {};
    if (typeof createdAt !== 'string'
      || stableStringify(recordedMetadata) !== stableStringify(expectedMetadata)) {
      throw new PilotError('RUN_METADATA_MISMATCH');
    }

    const metrics = computeMetrics({
      stimuli,
      gold,
      results,
      attempts,
      permutationPlan,
      agentBaseline: baseline,
      priceConfig,
      priceSnapshot,
      runMetadata,
      runSummary,
    });
    await writeJsonAtomically(metricsPath, metrics);
    return metrics;
  } finally {
    await unlock();
  }
}

export async function evaluateCli({
  args = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  evaluate = evaluateFixedPilotFiles,
} = {}) {
  if (args.length !== 0) {
    stderr.write('TypeSafe synthetic pilot metrics failed: ARGUMENTS_NOT_SUPPORTED\n');
    return 2;
  }
  try {
    const metrics = await evaluate();
    stdout.write('TypeSafe synthetic pilot metrics saved; accuracy, coverage, abstentions, provenance, and run measurements are separated.\n');
    stdout.write('Natural cases: ' + metrics.natural_page_cases.exact + '/' + metrics.natural_page_cases.total
      + '; controls without a request: ' + metrics.not_checked_controls.correct_no_call + '/'
      + metrics.not_checked_controls.total + '.\n');
    return 0;
  } catch (error) {
    stderr.write('TypeSafe synthetic pilot metrics failed: ' + safeErrorCode(error) + '\n');
    return 1;
  }
}

if (process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  evaluateCli().then((code) => { process.exitCode = code; });
}
