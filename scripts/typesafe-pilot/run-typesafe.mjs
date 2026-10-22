#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  ENDPOINT,
  MAX_INPUT_BYTES,
  MAX_REQUESTS,
  MAX_REQUEST_INPUT_TOKENS,
  MAX_RESPONSE_BYTES,
  MAX_RUN_USD,
  MAX_TOTAL_USAGE_TOKENS_PER_RESPONSE,
  MODEL,
  PILOT_DIR,
  PROTOCOL_ID,
  PROTOCOL_REVISION,
  REQUEST_TIMEOUT_MS,
  PilotError,
  acquireRunLock,
  assertSafeLocalFile,
  appendAttemptIntent,
  appendResult,
  buildCallPlan,
  buildRequest,
  estimateCost,
  exactKeys,
  readJsonLines,
  readSafeLocalFile,
  safeErrorCode,
  sha256,
  stableStringify,
  validateAttempts,
  validatePriceConfig,
  validateResponse,
  validateStimuli,
  validatePermutationPlan,
  writeJsonAtomically,
} from './protocol.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const RESULTS_DIR = path.resolve(PILOT_DIR, '../../typesafe-pilot-results');

async function readJson(filePath, failureCode, allowMissing = false) {
  const text = await readSafeLocalFile(filePath).catch(() => {
    throw new PilotError(failureCode);
  });
  if (text === null && allowMissing) return null;
  if (text === null) throw new PilotError(failureCode);
  try {
    return JSON.parse(text);
  } catch {
    throw new PilotError(failureCode);
  }
}

function parseJsonText(text, failureCode) {
  try {
    return JSON.parse(text);
  } catch {
    throw new PilotError(failureCode);
  }
}

function validateProtocol(protocol) {
  if (!protocol
    || protocol.protocol_id !== PROTOCOL_ID
    || protocol.protocol_revision !== PROTOCOL_REVISION
    || protocol.model !== MODEL
    || protocol.endpoint !== ENDPOINT
    || !protocol.request
    || protocol.request.timeout_ms !== REQUEST_TIMEOUT_MS
    || protocol.request.redirect !== 'error'
    || protocol.request.retry !== false
    || protocol.request.max_total_usage_tokens_per_response !== MAX_TOTAL_USAGE_TOKENS_PER_RESPONSE
    || protocol.request.max_total_attempts_including_failures !== MAX_REQUESTS
    || protocol.safety?.no_app_write !== true
    || protocol.safety?.no_contact_or_email_input !== true
    || protocol.safety?.no_generated_source_text_or_url !== true) {
    throw new PilotError('INVALID_PROTOCOL');
  }
  if (protocol.state !== 'ready_after_independent_review') {
    throw new PilotError('PILOT_REVIEW_PENDING');
  }
  for (const field of [
    'stimuli_sha256', 'gold_sha256', 'agent_baseline_sha256',
    'price_config_sha256', 'permutation_plan_sha256',
  ]) {
    if (typeof protocol[field] !== 'string' || !/^[a-f0-9]{64}$/.test(protocol[field])) {
      throw new PilotError('PILOT_INPUT_HASH_NOT_FROZEN');
    }
  }
}

function validateResultLog(results, attempts) {
  const attemptIds = new Set(attempts.map((item) => item.attempt_id));
  const resultIds = new Set();
  for (const result of results) {
    const validKeys = [
      'protocol_id', 'attempt_id', 'stimulus_id', 'variant', 'outcome', 'model',
      'window_status', 'evidence_id', 'evidence', 'usage', 'estimated_usage_cost_usd',
      'client_request_ms', 'provider_model_time_ms', 'provider_model_time_note',
      'elapsed_from_run_start_ms', 'received_at', 'no_update', 'requires_human_review',
    ];
    const errorKeys = [...validKeys, 'error_code'];
    if (!result
      || !['validated', 'safe_error'].includes(result.outcome)
      || !exactKeys(result, result.outcome === 'validated' ? validKeys : errorKeys)
      || typeof result.attempt_id !== 'string'
      || !attemptIds.has(result.attempt_id)
      || resultIds.has(result.attempt_id)
      || result.model !== MODEL
      || result.protocol_id !== PROTOCOL_ID
      || result.no_update !== true
      || result.requires_human_review !== true) {
      throw new PilotError('INVALID_LOCAL_LEDGER');
    }
    resultIds.add(result.attempt_id);
  }
  return resultIds;
}

function elapsedMs(started) {
  return Math.max(0, Math.round(Number(process.hrtime.bigint() - started) / 1_000_000));
}

function cancelResponseReader(reader) {
  try {
    const cancellation = reader.cancel();
    if (cancellation && typeof cancellation.catch === 'function') cancellation.catch(() => {});
  } catch {
    // Cancellation is best-effort after a malformed, oversized, or timed-out body.
  }
}

export async function readBoundedResponseBody(response, controller) {
  if (!response?.body || typeof response.body.getReader !== 'function') {
    throw new PilotError('INVALID_RESPONSE');
  }

  const { signal } = controller;
  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  const cancelOnAbort = () => cancelResponseReader(reader);
  signal.addEventListener('abort', cancelOnAbort, { once: true });

  try {
    while (true) {
      if (signal.aborted) throw new PilotError('REQUEST_TIMEOUT');

      let part;
      try {
        part = await reader.read();
      } catch {
        throw new PilotError(signal.aborted ? 'REQUEST_TIMEOUT' : 'INVALID_RESPONSE');
      }
      if (signal.aborted) throw new PilotError('REQUEST_TIMEOUT');
      if (!part || typeof part !== 'object' || typeof part.done !== 'boolean') {
        throw new PilotError('INVALID_RESPONSE');
      }
      if (part.done) break;
      if (!(part.value instanceof Uint8Array)) throw new PilotError('INVALID_RESPONSE');

      const nextTotal = totalBytes + part.value.byteLength;
      if (!Number.isSafeInteger(nextTotal) || nextTotal > MAX_RESPONSE_BYTES) {
        controller.abort();
        throw new PilotError('INVALID_RESPONSE');
      }

      totalBytes = nextTotal;
      // Keep bounded views only; do not copy or concatenate until the byte cap is proven.
      chunks.push(Buffer.from(part.value.buffer, part.value.byteOffset, part.value.byteLength));
    }

    if (signal.aborted) throw new PilotError('REQUEST_TIMEOUT');
    const bytes = Buffer.concat(chunks, totalBytes);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new PilotError('INVALID_RESPONSE');
    }
  } catch (error) {
    cancelResponseReader(reader);
    throw error instanceof PilotError
      ? error
      : new PilotError(signal.aborted ? 'REQUEST_TIMEOUT' : 'INVALID_RESPONSE');
  } finally {
    signal.removeEventListener('abort', cancelOnAbort);
    try {
      reader.releaseLock();
    } catch {
      // An unsettled body read must not mask the request's safe error result.
    }
  }
}

async function callTypeSafe({ fetchImpl, apiKey, request, stimulus, variant, startedAt, prices }) {
  const start = process.hrtime.bigint();
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      redirect: 'error',
      headers: {
        accept: 'application/json',
        authorization: 'Bearer ' + apiKey,
        'content-type': 'application/json',
      },
      body: request.bodyText,
      signal: controller.signal,
    });
    if (!response?.ok) {
      if (typeof response?.body?.cancel === 'function') cancelResponseReader(response.body);
      throw new PilotError('HTTP_REJECTED');
    }

    const responseText = await readBoundedResponseBody(response, controller);

    let rawResponse;
    try {
      rawResponse = JSON.parse(responseText);
    } catch {
      throw new PilotError('INVALID_RESPONSE');
    }
    const normalized = validateResponse(rawResponse, stimulus, request);
    const clientRequestMs = elapsedMs(start);
    return {
      protocol_id: PROTOCOL_ID,
      attempt_id: stimulus.stimulus_id + ':' + variant,
      stimulus_id: stimulus.stimulus_id,
      variant,
      outcome: 'validated',
      model: MODEL,
      window_status: normalized.window_status,
      evidence_id: normalized.evidence_id,
      evidence: normalized.evidence,
      usage: normalized.usage,
      estimated_usage_cost_usd: estimateCost(normalized.usage, prices),
      client_request_ms: clientRequestMs,
      provider_model_time_ms: null,
      provider_model_time_note: 'The response contract has no provider-reported model latency field.',
      elapsed_from_run_start_ms: elapsedMs(startedAt),
      received_at: new Date().toISOString(),
      no_update: true,
      requires_human_review: true,
    };
  } catch (error) {
    const code = timedOut
      ? 'REQUEST_TIMEOUT'
      : safeErrorCode(error);
    return {
      protocol_id: PROTOCOL_ID,
      attempt_id: stimulus.stimulus_id + ':' + variant,
      stimulus_id: stimulus.stimulus_id,
      variant,
      outcome: 'safe_error',
      model: MODEL,
      window_status: error?.observedResponse?.window_status ?? null,
      evidence_id: error?.observedResponse?.evidence_id ?? null,
      evidence: null,
      error_code: code,
      usage: error?.observedResponse?.usage ?? null,
      estimated_usage_cost_usd: error?.observedResponse?.usage
        ? estimateCost(error.observedResponse.usage, prices)
        : null,
      client_request_ms: elapsedMs(start),
      provider_model_time_ms: null,
      provider_model_time_note: 'The response contract has no provider-reported model latency field.',
      elapsed_from_run_start_ms: elapsedMs(startedAt),
      received_at: new Date().toISOString(),
      no_update: true,
      requires_human_review: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(fraction * sorted.length) - 1);
  return sorted[index];
}

function summarize(results, attempts, calls, noCalls, startedAt, startedWallTime, skipped, priceConfig, runMetadata) {
  const successes = results.filter((result) => result.outcome === 'validated');
  const errors = results.filter((result) => result.outcome === 'safe_error');
  const observedResponses = results.filter((result) => result.usage !== null);
  const inputTokens = observedResponses.reduce((sum, result) => sum + result.usage.input_tokens, 0);
  const outputTokens = observedResponses.reduce((sum, result) => sum + result.usage.output_tokens, 0);
  const costs = observedResponses.map((result) => result.estimated_usage_cost_usd);
  const requestTimes = results.map((result) => result.client_request_ms);
  const resultIds = new Set(results.map((result) => result.attempt_id));
  const unresolved = attempts.filter((item) => !resultIds.has(item.attempt_id))
    .map((item) => item.attempt_id);
  const costComplete = unresolved.length === 0
    && results.length === attempts.length
    && observedResponses.length === results.length
    && costs.every((cost) => typeof cost === 'number' && Number.isFinite(cost));
  return {
    protocol_id: PROTOCOL_ID,
    model: MODEL,
    started_at: startedWallTime,
    finished_at: new Date().toISOString(),
    total_runtime_ms: elapsedMs(startedAt),
    planned_api_attempts: calls.length,
    attempt_intents_recorded: attempts.length,
    requests_skipped_as_previously_attempted: skipped,
    successful_responses: successes.length,
    failed_attempts: errors.length + unresolved.length,
    failed_attempt_codes: errors.map((result) => result.error_code),
    not_checked_controls_no_call: noCalls.filter((item) => item.reason === 'not_checked_no_call').length,
    no_candidate_manual_review: noCalls.filter((item) => item.reason === 'no_candidates_manual_review').length,
    usage_tokens: { input_tokens: inputTokens, output_tokens: outputTokens },
    usage_cost_estimate_usd: costComplete
      ? costs.reduce((sum, cost) => sum + cost, 0)
      : null,
    cost_basis: 'published-price estimate from actual returned token usage; not an invoice',
    run_metadata: runMetadata,
    price_snapshot: {
      source_url: priceConfig.source_url,
      retrieved_at: priceConfig.retrieved_at,
      input_usd_per_million_tokens: priceConfig.input_usd_per_million_tokens,
      output_usd_per_million_tokens: priceConfig.output_usd_per_million_tokens,
      maximum_run_usd: priceConfig.maximum_run_usd,
    },
    cost_estimate_complete: costComplete,
    unresolved_attempt_ids: unresolved,
    client_request_ms: {
      p50: percentile(requestTimes, 0.50),
      p95: percentile(requestTimes, 0.95),
      maximum: requestTimes.length ? Math.max(...requestTimes) : null,
    },
    provider_model_time_ms: null,
    provider_model_time_note: 'The response contract has no provider-reported model latency field.',
    human_review_time_saving_percent: null,
    integration_roi_claim: false,
    no_app_update: true,
  };
}

export async function runFixedPilot({
  environment = process.env,
  fetchImpl = fetch,
  pilotDirectory = PILOT_DIR,
  resultDirectory = RESULTS_DIR,
} = {}) {
  const startedAt = process.hrtime.bigint();
  const startedWallTime = new Date().toISOString();
  const [stimuliText, protocolText, goldText, baselineText, priceConfigText, permutationPlanText] = await Promise.all([
    readFile(path.join(pilotDirectory, 'stimuli-only.json'), 'utf8').catch(() => {
      throw new PilotError('INVALID_STIMULI');
    }),
    readFile(path.join(pilotDirectory, 'protocol.json'), 'utf8').catch(() => {
      throw new PilotError('INVALID_PROTOCOL');
    }),
    readFile(path.join(pilotDirectory, 'gold.json'), 'utf8').catch(() => {
      throw new PilotError('GOLD_NOT_ADJUDICATED');
    }),
    readFile(path.join(pilotDirectory, 'agent-baseline.json'), 'utf8').catch(() => {
      throw new PilotError('AGENT_BASELINE_NOT_READY');
    }),
    readFile(path.join(pilotDirectory, 'price-config.json'), 'utf8').catch(() => {
      throw new PilotError('PRICE_CAP_NOT_CONFIGURED');
    }),
    readFile(path.join(pilotDirectory, 'permutation-plan.json'), 'utf8').catch(() => {
      throw new PilotError('INVALID_PERMUTATION_PLAN');
    }),
  ]);
  const protocol = parseJsonText(protocolText, 'INVALID_PROTOCOL');
  const priceConfig = parseJsonText(priceConfigText, 'PRICE_CAP_NOT_CONFIGURED');
  const permutationPlan = parseJsonText(permutationPlanText, 'INVALID_PERMUTATION_PLAN');

  validateProtocol(protocol);
  const stimuli = parseJsonText(stimuliText, 'INVALID_STIMULI');
  validateStimuli(stimuli);
  if (sha256(stimuliText) !== protocol.stimuli_sha256
    || sha256(goldText) !== protocol.gold_sha256
    || sha256(baselineText) !== protocol.agent_baseline_sha256
    || sha256(priceConfigText) !== protocol.price_config_sha256
    || sha256(permutationPlanText) !== protocol.permutation_plan_sha256) {
    throw new PilotError('PILOT_INPUT_HASH_MISMATCH');
  }
  validatePermutationPlan(permutationPlan, stimuli);
  const priceCheck = validatePriceConfig(priceConfig);
  if (priceConfig.maximum_run_usd > MAX_RUN_USD
    || priceCheck.worst_case_input_cost_usd > priceConfig.maximum_run_usd) {
    throw new PilotError('PRICE_CAP_TOO_LOW');
  }
  const apiKey = environment.TYPESAFE_API_KEY;
  if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey)) {
    throw new PilotError('MISSING_TYPESAFE_API_KEY');
  }
  const { calls, noCalls, byId } = buildCallPlan(stimuli, permutationPlan);
  const requestPlan = calls.map((call) => {
    const stimulus = byId.get(call.stimulus_id);
    const request = buildRequest(stimulus, call.variant);
    return { ...call, stimulus, request, requestHash: sha256(request.bodyText) };
  });
  if (requestPlan.length > MAX_REQUESTS
    || requestPlan.some((item) => Buffer.byteLength(item.request.bodyText, 'utf8') > MAX_INPUT_BYTES)) {
    throw new PilotError('REQUEST_CAP_REACHED');
  }

  const unlock = await acquireRunLock(resultDirectory);
  try {
    const attemptsPath = path.join(resultDirectory, 'attempts.jsonl');
    const resultsPath = path.join(resultDirectory, 'results.jsonl');
    const summaryPath = path.join(resultDirectory, 'run-summary.json');
    const priceSnapshotPath = path.join(resultDirectory, 'price-snapshot.json');
    const runMetadataPath = path.join(resultDirectory, 'run-metadata.json');
    for (const filePath of [
      attemptsPath, resultsPath, summaryPath, summaryPath + '.tmp',
      priceSnapshotPath, priceSnapshotPath + '.tmp',
      runMetadataPath, runMetadataPath + '.tmp',
      path.join(resultDirectory, 'run.lock'),
    ]) {
      await assertSafeLocalFile(filePath);
    }
    const attempts = await readJsonLines(attemptsPath);
    const attemptedIds = validateAttempts(attempts);
    const results = await readJsonLines(resultsPath);
    validateResultLog(results, attempts);
    const runMetadataCore = {
      version: 1,
      protocol_id: PROTOCOL_ID,
      protocol_revision: PROTOCOL_REVISION,
      model: MODEL,
      protocol_sha256: sha256(protocolText),
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
    const existingPriceSnapshot = await readJson(priceSnapshotPath, 'PRICE_SNAPSHOT_MISSING', true);
    const existingRunMetadata = await readJson(runMetadataPath, 'RUN_METADATA_MISSING', true);
    const hasPreviousState = attempts.length > 0 || results.length > 0;
    if (hasPreviousState && (!existingPriceSnapshot || !existingRunMetadata)) {
      throw new PilotError('RUN_METADATA_MISSING');
    }
    if (existingPriceSnapshot
      && stableStringify(existingPriceSnapshot) !== stableStringify(priceConfig)) {
      throw new PilotError('PRICE_SNAPSHOT_MISMATCH');
    }
    let runMetadata;
    if (existingRunMetadata) {
      const { created_at: createdAt, ...recordedCore } = existingRunMetadata;
      if (typeof createdAt !== 'string' || stableStringify(recordedCore) !== stableStringify(runMetadataCore)) {
        throw new PilotError('RUN_METADATA_MISMATCH');
      }
      runMetadata = existingRunMetadata;
    } else {
      runMetadata = { ...runMetadataCore, created_at: new Date().toISOString() };
    }
    if (!existingPriceSnapshot) await writeJsonAtomically(priceSnapshotPath, priceConfig);
    if (!existingRunMetadata) await writeJsonAtomically(runMetadataPath, runMetadata);

    const requestHashesByAttempt = new Map(requestPlan.map((call) => [
      call.stimulus_id + ':' + call.variant,
      call.requestHash,
    ]));
    for (const attempt of attempts) {
      if (!requestHashesByAttempt.has(attempt.attempt_id)) {
        throw new PilotError('ATTEMPT_OUTSIDE_FIXED_PLAN');
      }
      if (requestHashesByAttempt.get(attempt.attempt_id) !== attempt.request_sha256) {
        throw new PilotError('ATTEMPT_REQUEST_HASH_MISMATCH');
      }
    }
    const skipped = requestPlan.filter((call) => attemptedIds.has(call.stimulus_id + ':' + call.variant)).length;
    if (attempts.length > MAX_REQUESTS) throw new PilotError('REQUEST_CAP_REACHED');

    for (const call of requestPlan) {
      const attemptId = call.stimulus_id + ':' + call.variant;
      if (attemptedIds.has(attemptId)) continue;
      if (attempts.length >= MAX_REQUESTS) throw new PilotError('REQUEST_CAP_REACHED');

      const intent = await appendAttemptIntent(
        attemptsPath,
        call,
        call.requestHash,
        new Date().toISOString(),
      );
      attempts.push(intent);
      attemptedIds.add(attemptId);

      const result = await callTypeSafe({
        fetchImpl,
        apiKey,
        request: call.request,
        stimulus: call.stimulus,
        variant: call.variant,
        startedAt,
        prices: priceConfig,
      });
      result.elapsed_from_run_start_ms = elapsedMs(startedAt);
      await appendResult(resultsPath, result);
      results.push(result);

      const cost = result.estimated_usage_cost_usd;
      const knownCost = results.reduce((sum, item) => sum + (item.estimated_usage_cost_usd ?? 0), 0);
      if (cost !== null && knownCost > priceConfig.maximum_run_usd) {
        throw new PilotError('PRICE_CAP_REACHED');
      }
    }

    const summary = summarize(results, attempts, calls, noCalls, startedAt, startedWallTime, skipped, priceConfig, runMetadata);
    await writeJsonAtomically(summaryPath, summary);
    return summary;
  } finally {
    await unlock();
  }
}

export async function runCli({
  args = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  run = runFixedPilot,
} = {}) {
  if (args.length !== 0) {
    stderr.write('TypeSafe synthetic pilot failed: ARGUMENTS_NOT_SUPPORTED\n');
    return 2;
  }
  try {
    const summary = await run();
    stdout.write('TypeSafe synthetic pilot finished; see the protected result directory for counts and timings.\n');
    stdout.write('Attempts: ' + summary.attempt_intents_recorded + '; successful: '
      + summary.successful_responses + '; failed: ' + summary.failed_attempts + '.\n');
    return 0;
  } catch (error) {
    stderr.write('TypeSafe synthetic pilot failed: ' + safeErrorCode(error) + '\n');
    return 1;
  }
}

if (process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((code) => { process.exitCode = code; });
}
