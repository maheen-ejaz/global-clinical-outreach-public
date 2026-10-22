import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir, access, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ENDPOINT,
  MAX_RESPONSE_BYTES,
  MAX_REQUESTS,
  ANALYSIS_REVISION,
  MODEL,
  NO_EVIDENCE,
  PROTOCOL_ID,
  PROTOCOL_REVISION,
  PilotError,
  appendAttemptIntent,
  buildCallPlan,
  buildRequest,
  exactKeys,
  sha256,
  shouldCall,
  stableStringify,
  validateAttempts,
  validatePriceConfig,
  validateResponse,
  validateStimuli,
} from './protocol.mjs';
import { computeMetrics } from './metrics.mjs';
import { readBoundedResponseBody, runCli, runFixedPilot } from './run-typesafe.mjs';
import { PILOT_DIR } from './protocol.mjs';
import { evaluateFixedPilotFiles } from './evaluate-typesafe-pilot.mjs';

const stimuli = JSON.parse(await readFile(new URL('./stimuli-only.json', import.meta.url), 'utf8'));
const goldDraft = JSON.parse(await readFile(new URL('./gold.json', import.meta.url), 'utf8'));
const permutationPlan = JSON.parse(await readFile(new URL('./permutation-plan.json', import.meta.url), 'utf8'));
const priceConfig = JSON.parse(await readFile(new URL('./price-config.json', import.meta.url), 'utf8'));
const agentBaseline = JSON.parse(await readFile(new URL('./agent-baseline.json', import.meta.url), 'utf8'));
const protocol = JSON.parse(await readFile(new URL('./protocol.json', import.meta.url), 'utf8'));

function choiceAnswer(criteria, choice, confidence = 0.85) {
  const keys = Object.keys(criteria);
  const remainder = (1 - confidence) / (keys.length - 1);
  return {
    type: 'choice',
    choice,
    probabilities: Object.fromEntries(keys.map((key) => [key, key === choice ? confidence : remainder])),
    confidence,
  };
}

function responseFor(request, windowStatus, evidenceId = NO_EVIDENCE) {
  return {
    model: MODEL,
    answers: {
      window_status: choiceAnswer(request.statusCriteria, windowStatus),
      evidence_id: choiceAnswer(request.candidateCriteria, evidenceId, 0.92),
    },
    usage: { input_tokens: 100, output_tokens: 5 },
  };
}

function streamedResponse(chunks, { onCancel = () => {}, holdAfterChunks = false, onPull = () => {} } = {}) {
  let index = 0;
  return {
    ok: true,
    body: new ReadableStream({
      pull(controller) {
        onPull(index);
        if (index < chunks.length) {
          controller.enqueue(chunks[index]);
          index += 1;
        } else if (holdAfterChunks) {
          return new Promise(() => {});
        } else {
          controller.close();
        }
      },
      cancel: onCancel,
    }, { highWaterMark: 0 }),
  };
}

function streamedJsonResponse(value) {
  return streamedResponse([new TextEncoder().encode(JSON.stringify(value))]);
}

async function tempDir(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gco-typesafe-pilot-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function resultFromGold(stimulus, goldRow, variant = 'base') {
  const request = buildRequest(stimulus, variant);
  const validated = validateResponse(
    responseFor(request, goldRow.expected_window_status, goldRow.expected_evidence_id),
    stimulus,
    request,
  );
  return {
    protocol_id: PROTOCOL_ID,
    attempt_id: stimulus.stimulus_id + ':' + variant,
    stimulus_id: stimulus.stimulus_id,
    variant,
    outcome: 'validated',
    model: MODEL,
    window_status: validated.window_status,
    evidence_id: validated.evidence_id,
    evidence: validated.evidence,
    usage: validated.usage,
    estimated_usage_cost_usd: 0.0000042,
    client_request_ms: 10,
    provider_model_time_ms: null,
    provider_model_time_note: 'The response contract has no provider-reported model latency field.',
    elapsed_from_run_start_ms: 10,
    received_at: '2026-10-15T00:00:00.000Z',
    no_update: true,
    requires_human_review: true,
  };
}

test('frozen stimuli have 24 page, 8 not-checked, and 8 challenge cases with no labels', async () => {
  const validated = validateStimuli(stimuli);
  assert.equal(protocol.protocol_id, PROTOCOL_ID);
  assert.equal(protocol.protocol_revision, PROTOCOL_REVISION);
  assert.equal(ANALYSIS_REVISION, 2);
  assert.deepEqual(validated.groups, { page: 24, not_checked_control: 8, challenge: 8 });
  assert.equal(stimuli.cases.length, 40);
  assert.equal(protocol.stimuli_sha256, sha256(await readFile(new URL('./stimuli-only.json', import.meta.url))));
  assert.equal(protocol.gold_sha256, sha256(await readFile(new URL('./gold.json', import.meta.url))));
  assert.equal(protocol.agent_baseline_sha256, sha256(await readFile(new URL('./agent-baseline.json', import.meta.url))));
  assert.equal(protocol.price_config_sha256, sha256(await readFile(new URL('./price-config.json', import.meta.url))));
  assert.equal(protocol.permutation_plan_sha256, sha256(await readFile(new URL('./permutation-plan.json', import.meta.url))));
  const worstCasePrice = validatePriceConfig(priceConfig).worst_case_input_cost_usd;
  assert.equal(worstCasePrice, 0.05376);
  assert.equal(worstCasePrice < priceConfig.maximum_run_usd, true);
  assert.equal(Object.keys(agentBaseline.window_status_by_stimulus).length, 40);
  for (const item of stimuli.cases) {
    assert.equal(item.synthetic, true);
    assert.equal(Object.hasOwn(item, 'expected_window_status'), false);
    assert.equal(Object.hasOwn(item, 'expected_evidence_id'), false);
    assert.equal(item.pages.every((page) => page.source_url.startsWith('https://synthetic.example/')), true);
    assert.equal(item.pages.every((page) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i.test(page.text)), true);
  }
});

test('call plan has 32 base calls, 8 no-call controls, and 8 order repeats', () => {
  const plan = buildCallPlan(stimuli, permutationPlan);
  assert.equal(plan.calls.filter((call) => call.variant === 'base').length, 32);
  assert.equal(plan.calls.filter((call) => call.variant === 'permuted').length, 8);
  assert.equal(plan.calls.length, MAX_REQUESTS);
  assert.equal(plan.noCalls.length, 8);
  assert.equal(plan.noCalls.every((item) => item.reason === 'not_checked_no_call'), true);
  for (const id of permutationPlan.stimulus_ids) {
    assert.equal(plan.calls.filter((item) => item.stimulus_id === id).length, 2);
  }
});

test('request uses typed Choice questions, fixed model, no URL mapping, and reversed option order', () => {
  const fixed = stimuli.cases.find((item) => item.stimulus_id === 'fixed-01');
  const base = buildRequest(fixed, 'base');
  const permuted = buildRequest(fixed, 'permuted');

  assert.equal(base.body.model, 'jev-1.13.0');
  assert.equal(base.body.questions.window_status.type, 'choice');
  assert.equal(base.body.questions.evidence_id.type, 'choice');
  assert.equal(base.body.questions.evidence_id.instructions.includes('window_status'), false);
  assert.equal(base.body.questions.evidence_id.instructions.includes('selected status'), false);
  assert.equal(base.body.questions.evidence_id.instructions.includes('standalone'), true);
  assert.equal(base.body.questions.evidence_id.criteria[NO_EVIDENCE].includes('selected status'), false);
  assert.deepEqual(base.body.state, permuted.body.state);
  assert.deepEqual(Object.keys(permuted.statusCriteria), Object.keys(base.statusCriteria).reverse());
  assert.deepEqual(Object.keys(permuted.candidateCriteria), [
    NO_EVIDENCE,
    ...Object.keys(base.candidateCriteria).filter((key) => key !== NO_EVIDENCE).reverse(),
  ]);
  assert.equal(base.bodyText.includes('source_url'), false);
  assert.equal(base.bodyText.includes('https://synthetic.example/'), false);
  assert.equal(base.bodyText.includes('as_of_date'), false);
  assert.equal(base.bodyText.includes('expected_window_status'), false);
  assert.equal(base.bodyText.includes('gold'), false);
  assert.equal(base.body.state.stimulus_id, 'fixed-01');
});

test('not_checked controls and empty candidate sets are no-call/manual-review cases', () => {
  const control = stimuli.cases.find((item) => item.record_group === 'not_checked_control');
  assert.equal(shouldCall(control), false);
  assert.throws(() => buildRequest(control), (error) => error.code === 'NOT_CHECKED_NO_CALL');

  const pageCase = stimuli.cases.find((item) => item.record_group === 'page');
  const missing = { ...pageCase, candidate_paragraphs: [] };
  assert.equal(shouldCall(missing), false);
  assert.throws(() => buildRequest(missing), (error) => error.code === 'NO_CANDIDATE_NO_UPDATE');
});

test('not_stated uses decoy candidates and positive evidence is copied from frozen input', () => {
  const notStated = stimuli.cases.find((item) => item.stimulus_id === 'not-stated-01');
  const noEvidenceRequest = buildRequest(notStated);
  const noEvidenceAnswer = responseFor(noEvidenceRequest, 'not_stated', NO_EVIDENCE);
  const noEvidenceResult = validateResponse(noEvidenceAnswer, notStated, noEvidenceRequest);
  assert.equal(noEvidenceResult.evidence, null);
  assert.equal(noEvidenceResult.no_update, true);
  assert.equal(noEvidenceResult.requires_human_review, true);

  const fixed = stimuli.cases.find((item) => item.stimulus_id === 'fixed-01');
  const request = buildRequest(fixed);
  const candidateId = fixed.candidate_paragraphs[0].candidate_id;
  const positive = validateResponse(responseFor(request, 'fixed_dates', candidateId), fixed, request);
  assert.equal(positive.evidence.candidate_id, candidateId);
  assert.equal(positive.evidence.exact_paragraph, fixed.candidate_paragraphs[0].paragraph);
  assert.equal(positive.evidence.source_url, fixed.pages.find((page) => page.page_id === fixed.candidate_paragraphs[0].page_id).source_url);
});

test('response validation rejects malformed answers, requires positive evidence, and ignores nonpositive evidence', () => {
  const fixed = stimuli.cases.find((item) => item.stimulus_id === 'fixed-01');
  const request = buildRequest(fixed);
  const valid = responseFor(request, 'fixed_dates', fixed.candidate_paragraphs[0].candidate_id);

  const wrongArgmax = structuredClone(valid);
  wrongArgmax.answers.window_status.probabilities.fixed_dates = 0.1;
  wrongArgmax.answers.window_status.probabilities.rolling = 0.85;
  assert.throws(() => validateResponse(wrongArgmax, fixed, request), (error) => error.code === 'INVALID_RESPONSE');

  const invented = structuredClone(valid);
  invented.answers.evidence_id.choice = 'made-up-id';
  assert.throws(() => validateResponse(invented, fixed, request), (error) => error.code === 'INVALID_RESPONSE');

  const noEvidence = responseFor(request, 'fixed_dates', NO_EVIDENCE);
  assert.throws(() => validateResponse(noEvidence, fixed, request), (error) => {
    assert.equal(error.code, 'POSITIVE_STATUS_WITHOUT_EVIDENCE');
    assert.equal(error.observedResponse.window_status.choice, 'fixed_dates');
    assert.equal(error.observedResponse.evidence_id.choice, NO_EVIDENCE);
    assert.deepEqual(error.observedResponse.usage, { input_tokens: 100, output_tokens: 5 });
    assert.deepEqual(error.observedResponse.window_status.probabilities, noEvidence.answers.window_status.probabilities);
    assert.deepEqual(error.observedResponse.evidence_id.probabilities, noEvidence.answers.evidence_id.probabilities);
    return true;
  });

  const hasEvidence = responseFor(request, 'not_stated', fixed.candidate_paragraphs[0].candidate_id);
  const nonpositive = validateResponse(hasEvidence, fixed, request);
  assert.equal(nonpositive.window_status.choice, 'not_stated');
  assert.equal(nonpositive.evidence_id.choice, fixed.candidate_paragraphs[0].candidate_id);
  assert.deepEqual(nonpositive.evidence_id.probabilities, hasEvidence.answers.evidence_id.probabilities);
  assert.equal(nonpositive.evidence_id.confidence, hasEvidence.answers.evidence_id.confidence);
  assert.equal(nonpositive.evidence, null, 'unused candidate answers never export quote text or source URL');
});

test('gold evidence must semantically support its status, not merely match a page span', () => {
  const badEvidence = [
    ['challenge-long-context-01', 'challenge-long-context-01-p1'],
    ['challenge-negation-01', 'challenge-negation-01-p1'],
    ['challenge-negative-rolling-01', 'challenge-negative-rolling-01-p1'],
  ];
  for (const [stimulusId, wrongCandidateId] of badEvidence) {
    const gold = structuredClone(goldDraft);
    const row = gold.cases.find((item) => item.stimulus_id === stimulusId);
    const stimulus = stimuli.cases.find((item) => item.stimulus_id === stimulusId);
    const candidate = stimulus.candidate_paragraphs.find((item) => item.candidate_id === wrongCandidateId);
    const page = stimulus.pages.find((item) => item.page_id === candidate.page_id);
    row.expected_evidence_id = candidate.candidate_id;
    row.expected_exact_quote = candidate.paragraph;
    row.expected_source_url = page.source_url;
    assert.throws(
      () => computeMetrics({
        stimuli,
        gold,
        results: [],
        attempts: [],
        permutationPlan,
        allowDraftGold: true,
      }),
      (error) => error.code === 'GOLD_EVIDENCE_STATUS_MISMATCH',
    );
  }
});

test('challenge stimuli include injection, negation, stale dates, mixed status, and long candidate lists', () => {
  const challenges = stimuli.cases.filter((item) => item.record_group === 'challenge');
  assert.equal(challenges.length, 8);
  assert.equal(challenges.find((item) => item.stimulus_id === 'challenge-injection-01').pages[1].text.includes('Ignore all prior directions'), true);
  assert.equal(challenges.find((item) => item.stimulus_id === 'challenge-negation-01').pages[1].text.includes('not accepted on a rolling basis'), true);
  assert.equal(challenges.find((item) => item.stimulus_id === 'challenge-past-date-01').pages[1].text.includes('2022'), true);
  assert.equal(challenges.find((item) => item.stimulus_id === 'challenge-overlap-01').pages[1].text.includes('year-round'), true);
  const long = challenges.find((item) => item.stimulus_id === 'challenge-long-context-01');
  assert.equal(long.candidate_paragraphs.length, 21);
  assert.equal(buildRequest(long).body.state.candidate_paragraphs.at(-1).candidate_id, 'challenge-long-context-01-p21');
  assert.equal(buildRequest(long).bodyText.includes('Paragraph 40:'), false);
});

test('attempt journal is durable, counts failed intent, refuses duplicate IDs, and enforces the 40 cap', async (t) => {
  const directory = await tempDir(t);
  const journal = path.join(directory, 'attempts.jsonl');
  const hash = 'a'.repeat(64);

  await appendAttemptIntent(journal, { stimulus_id: 'sample-01', variant: 'base' }, hash, '2026-10-15T00:00:00.000Z');
  await assert.rejects(
    appendAttemptIntent(journal, { stimulus_id: 'sample-01', variant: 'base' }, hash, '2026-10-15T00:00:01.000Z'),
    (error) => error.code === 'DUPLICATE_ATTEMPT_REFUSED',
  );
  for (let index = 2; index <= 40; index += 1) {
    await appendAttemptIntent(
      journal,
      { stimulus_id: 'sample-' + String(index).padStart(2, '0'), variant: 'base' },
      hash,
      '2026-10-15T00:00:00.000Z',
    );
  }
  await assert.rejects(
    appendAttemptIntent(journal, { stimulus_id: 'sample-41', variant: 'base' }, hash),
    (error) => error.code === 'REQUEST_CAP_REACHED',
  );
  const attempts = (await readFile(journal, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(validateAttempts(attempts).size, 40);
  assert.equal(attempts[0].sequence, 1);
  assert.equal(attempts.at(-1).sequence, 40);
});

test('live runner is held pending blind review and makes no fetch or output', async (t) => {
  const { pilotDirectory, resultDirectory } = await readyTestPilot(t, 'pending-results');
  const pendingProtocol = JSON.parse(await readFile(path.join(pilotDirectory, 'protocol.json'), 'utf8'));
  pendingProtocol.state = 'pending_v2_security_review';
  await writeFile(path.join(pilotDirectory, 'protocol.json'), JSON.stringify(pendingProtocol));
  let calls = 0;
  await assert.rejects(
    runFixedPilot({
      pilotDirectory,
      environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
      fetchImpl: async () => { calls += 1; throw new Error('must not fetch'); },
      resultDirectory,
    }),
    (error) => error.code === 'PILOT_REVIEW_PENDING',
  );
  assert.equal(calls, 0);
  await assert.rejects(access(resultDirectory), (error) => error.code === 'ENOENT');

  let ran = false;
  let stderr = '';
  const status = await runCli({
    args: ['--input', '/tmp/other.json'],
    run: async () => { ran = true; },
    stderr: { write: (text) => { stderr += text; } },
    stdout: { write: () => {} },
  });
  assert.equal(status, 2);
  assert.equal(ran, false);
  assert.equal(stderr.includes('ARGUMENTS_NOT_SUPPORTED'), true);
});

test('response stream checks split chunks before concatenation and aborts/cancels at the byte cap', async () => {
  let pulls = 0;
  let cancelled = false;
  const response = streamedResponse([
    new Uint8Array(MAX_RESPONSE_BYTES - 1),
    new Uint8Array(2),
    new Uint8Array([0x7b]),
  ], {
    onPull: () => { pulls += 1; },
    onCancel: () => { cancelled = true; },
  });
  const controller = new AbortController();

  await assert.rejects(
    readBoundedResponseBody(response, controller),
    (error) => error.code === 'INVALID_RESPONSE',
  );
  assert.equal(controller.signal.aborted, true);
  assert.equal(cancelled, true);
  assert.equal(pulls, 2, 'the next stream chunk is not pulled after the cap is crossed');
});

test('request abort covers a stalled response body and cancels its reader', async () => {
  let cancelled = false;
  const response = streamedResponse([], {
    holdAfterChunks: true,
    onCancel: () => { cancelled = true; },
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10);
  try {
    await assert.rejects(
      readBoundedResponseBody(response, controller),
      (error) => error.code === 'REQUEST_TIMEOUT',
    );
  } finally {
    clearTimeout(timeout);
  }
  assert.equal(controller.signal.aborted, true);
  assert.equal(cancelled, true);
});

async function readyTestPilot(t, resultDirectoryName) {
  const directory = await tempDir(t);
  const pilotDirectory = path.join(directory, 'pilot');
  const resultDirectory = path.join(directory, resultDirectoryName);
  await mkdir(pilotDirectory);
  for (const name of ['stimuli-only.json', 'gold.json', 'agent-baseline.json', 'permutation-plan.json', 'price-config.json']) {
    await writeFile(path.join(pilotDirectory, name), await readFile(path.join(PILOT_DIR, name)));
  }
  const protocol = JSON.parse(await readFile(path.join(PILOT_DIR, 'protocol.json'), 'utf8'));
  protocol.state = 'ready_after_independent_review';
  const stimulusBytes = await readFile(path.join(pilotDirectory, 'stimuli-only.json'));
  protocol.stimuli_sha256 = sha256(stimulusBytes);
  protocol.gold_sha256 = sha256(await readFile(path.join(pilotDirectory, 'gold.json')));
  protocol.agent_baseline_sha256 = sha256(await readFile(path.join(pilotDirectory, 'agent-baseline.json')));
  protocol.price_config_sha256 = sha256(await readFile(path.join(pilotDirectory, 'price-config.json')));
  protocol.permutation_plan_sha256 = sha256(await readFile(path.join(pilotDirectory, 'permutation-plan.json')));
  await writeFile(path.join(pilotDirectory, 'protocol.json'), JSON.stringify(protocol, null, 2) + '\n');
  return { pilotDirectory, resultDirectory };
}

function fakeSuccessResponse(requestBody) {
  const body = JSON.parse(requestBody);
  const statusCriteria = body.questions.window_status.criteria;
  const evidenceCriteria = body.questions.evidence_id.criteria;
  return {
    model: MODEL,
    answers: {
      window_status: choiceAnswer(statusCriteria, 'unclear', 0.70),
      evidence_id: choiceAnswer(evidenceCriteria, NO_EVIDENCE, 0.92),
    },
    usage: { input_tokens: 120, output_tokens: 9 },
  };
}

test('offline runner journals each intent before fake fetch, counts 40, and resume never duplicates', async (t) => {
  const { pilotDirectory, resultDirectory } = await readyTestPilot(t, 'run-results');
  let fetchCount = 0;
  const fakeFetch = async (url, options) => {
    fetchCount += 1;
    assert.equal(url, ENDPOINT);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.signal instanceof AbortSignal, true);
    const body = JSON.parse(options.body);
    assert.equal(body.model, MODEL);
    const journal = (await readFile(path.join(resultDirectory, 'attempts.jsonl'), 'utf8')).trim()
      .split('\n').map((line) => JSON.parse(line));
    const last = journal.at(-1);
    assert.equal(last.stimulus_id, body.state.stimulus_id);
    assert.equal(last.request_sha256, sha256(options.body));
    return streamedJsonResponse(fakeSuccessResponse(options.body));
  };

  const summary = await runFixedPilot({
    environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
    fetchImpl: fakeFetch,
    pilotDirectory,
    resultDirectory,
  });
  assert.equal(fetchCount, 40);
  assert.equal(summary.attempt_intents_recorded, 40);
  assert.equal(summary.successful_responses, 40);
  assert.equal(summary.failed_attempts, 0);
  assert.equal(summary.not_checked_controls_no_call, 8);
  assert.equal(summary.usage_tokens.input_tokens, 4800);
  assert.equal(summary.usage_tokens.output_tokens, 360);
  assert.equal(summary.human_review_time_saving_percent, null);
  assert.equal(summary.integration_roi_claim, false);

  const resumed = await runFixedPilot({
    environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
    fetchImpl: async () => { throw new Error('duplicate fetch'); },
    pilotDirectory,
    resultDirectory,
  });
  assert.equal(resumed.requests_skipped_as_previously_attempted, 40);
  assert.equal(fetchCount, 40);
  assert.equal(summary.run_metadata.maximum_api_attempts_including_failures, 40);
  assert.equal(summary.run_metadata.protocol_revision, 2);
  assert.equal(summary.run_metadata.worst_case_input_cost_usd, 0.05376);
  const metadata = JSON.parse(await readFile(path.join(resultDirectory, 'run-metadata.json'), 'utf8'));
  assert.equal(metadata.gold_sha256, JSON.parse(await readFile(path.join(pilotDirectory, 'protocol.json'), 'utf8')).gold_sha256);
  assert.equal(metadata.agent_baseline_sha256, JSON.parse(await readFile(path.join(pilotDirectory, 'protocol.json'), 'utf8')).agent_baseline_sha256);

  const attemptsPath = path.join(resultDirectory, 'attempts.jsonl');
  const originalAttemptsText = await readFile(attemptsPath, 'utf8');
  const attempts = originalAttemptsText.trim().split('\n').map((line) => JSON.parse(line));
  attempts[0].request_sha256 = 'f'.repeat(64);
  await writeFile(attemptsPath, attempts.map((item) => JSON.stringify(item)).join('\n') + '\n');
  await assert.rejects(
    runFixedPilot({
      environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
      fetchImpl: async () => { throw new Error('mismatched request must not fetch'); },
      pilotDirectory,
      resultDirectory,
    }),
    (error) => error.code === 'ATTEMPT_REQUEST_HASH_MISMATCH',
  );
  assert.equal(fetchCount, 40);
  await writeFile(attemptsPath, originalAttemptsText);

  const resultsPath = path.join(resultDirectory, 'results.jsonl');
  const resultsText = await readFile(resultsPath, 'utf8');
  await writeFile(resultsPath, resultsText + resultsText.split('\n')[0] + '\n');
  await assert.rejects(
    runFixedPilot({
      environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
      fetchImpl: async () => { throw new Error('duplicate result must not fetch'); },
      pilotDirectory,
      resultDirectory,
    }),
    (error) => error.code === 'INVALID_LOCAL_LEDGER',
  );
  assert.equal(fetchCount, 40);
  await writeFile(resultsPath, resultsText);

  const fileMetrics = await evaluateFixedPilotFiles({ pilotDirectory, resultDirectory });
  assert.equal(fileMetrics.protocol_id, PROTOCOL_ID);
  assert.equal(fileMetrics.analysis_revision, ANALYSIS_REVISION);
  assert.equal(fileMetrics.natural_page_cases.total, 24);
  assert.equal(fileMetrics.not_checked_controls.total, 8);
  assert.equal(fileMetrics.human_review_time_saving_percent, null);
  assert.equal(fileMetrics.integration_roi_claim, false);

  const baselinePath = path.join(pilotDirectory, 'agent-baseline.json');
  const baselineText = await readFile(baselinePath, 'utf8');
  await writeFile(baselinePath, baselineText + ' ');
  await assert.rejects(
    evaluateFixedPilotFiles({ pilotDirectory, resultDirectory }),
    (error) => error.code === 'PILOT_INPUT_HASH_MISMATCH',
  );
});

test('baseline hash mismatch is rejected before any request', async (t) => {
  const { pilotDirectory, resultDirectory } = await readyTestPilot(t, 'baseline-mismatch-results');
  const baselinePath = path.join(pilotDirectory, 'agent-baseline.json');
  await writeFile(baselinePath, (await readFile(baselinePath, 'utf8')) + ' ');
  let calls = 0;

  await assert.rejects(
    runFixedPilot({
      environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
      fetchImpl: async () => { calls += 1; throw new Error('must not fetch'); },
      pilotDirectory,
      resultDirectory,
    }),
    (error) => error.code === 'PILOT_INPUT_HASH_MISMATCH',
  );
  assert.equal(calls, 0);
  await assert.rejects(access(resultDirectory), (error) => error.code === 'ENOENT');
});

test('positive composition errors retain validated choices and usage without attaching evidence text', async (t) => {
  const { pilotDirectory, resultDirectory } = await readyTestPilot(t, 'composition-error-results');
  let calls = 0;
  const fakeFetch = async (url, options) => {
    calls += 1;
    const request = JSON.parse(options.body);
    const statusCriteria = request.questions.window_status.criteria;
    const evidenceCriteria = request.questions.evidence_id.criteria;
    const response = calls === 1
      ? {
        model: MODEL,
        answers: {
          window_status: choiceAnswer(statusCriteria, 'fixed_dates', 0.70),
          evidence_id: choiceAnswer(evidenceCriteria, NO_EVIDENCE, 0.70),
        },
        usage: { input_tokens: 120, output_tokens: 9 },
      }
      : fakeSuccessResponse(options.body);
    return streamedJsonResponse(response);
  };

  const summary = await runFixedPilot({
    environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
    fetchImpl: fakeFetch,
    pilotDirectory,
    resultDirectory,
  });
  const resultLines = (await readFile(path.join(resultDirectory, 'results.jsonl'), 'utf8')).trim().split('\n');
  const first = JSON.parse(resultLines[0]);
  assert.equal(calls, 40);
  assert.equal(first.outcome, 'safe_error');
  assert.equal(first.error_code, 'POSITIVE_STATUS_WITHOUT_EVIDENCE');
  assert.equal(first.window_status.choice, 'fixed_dates');
  assert.equal(first.evidence_id.choice, NO_EVIDENCE);
  assert.equal(first.evidence, null);
  assert.deepEqual(first.usage, { input_tokens: 120, output_tokens: 9 });
  assert.deepEqual(Object.keys(first.window_status).sort(), ['choice', 'confidence', 'probabilities']);
  assert.equal(Object.values(first.window_status.probabilities).every(Number.isFinite), true);
  assert.equal(first.estimated_usage_cost_usd, 0.00000504);
  assert.equal(summary.failed_attempts, 1);
  assert.equal(summary.usage_tokens.input_tokens, 4800);
  assert.equal(summary.usage_tokens.output_tokens, 360);
  assert.equal(summary.cost_estimate_complete, true);

  const metrics = await evaluateFixedPilotFiles({ pilotDirectory, resultDirectory });
  assert.equal(metrics.usage.input_tokens, 4800);
  assert.equal(metrics.usage.output_tokens, 360);
  assert.equal(metrics.usage.cost_estimate_complete, true);
});

test('v1 attempts and results are refused under v2 without mutation or replay', async (t) => {
  const { pilotDirectory, resultDirectory } = await readyTestPilot(t, 'v1-ledger-results');
  await mkdir(resultDirectory);
  const call = buildCallPlan(stimuli, permutationPlan).calls[0];
  const stimulus = stimuli.cases.find((item) => item.stimulus_id === call.stimulus_id);
  const request = buildRequest(stimulus, call.variant);
  const attemptsPath = path.join(resultDirectory, 'attempts.jsonl');
  const resultsPath = path.join(resultDirectory, 'results.jsonl');
  await appendAttemptIntent(attemptsPath, call, sha256(request.bodyText));
  const goldRow = goldDraft.cases.find((item) => item.stimulus_id === call.stimulus_id);
  const oldResult = { ...resultFromGold(stimulus, goldRow, call.variant), protocol_id: 'gco-window-status-synthetic-v1' };
  await writeFile(resultsPath, JSON.stringify(oldResult) + '\n');
  const originalAttempts = await readFile(attemptsPath, 'utf8');
  const originalResults = await readFile(resultsPath, 'utf8');
  let calls = 0;

  await assert.rejects(
    runFixedPilot({
      environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
      fetchImpl: async () => { calls += 1; throw new Error('v1 attempt must not replay'); },
      pilotDirectory,
      resultDirectory,
    }),
    (error) => error.code === 'INVALID_LOCAL_LEDGER',
  );
  assert.equal(calls, 0);
  assert.equal(await readFile(attemptsPath, 'utf8'), originalAttempts);
  assert.equal(await readFile(resultsPath, 'utf8'), originalResults);
  await assert.rejects(access(path.join(resultDirectory, 'run-metadata.json')), (error) => error.code === 'ENOENT');
});

test('result-path symlinks are rejected before any fake request or outside write', async (t) => {
  const parent = await tempDir(t);
  const { pilotDirectory, resultDirectory } = await readyTestPilot(t, 'symlink-results');
  await mkdir(resultDirectory);
  const outside = path.join(parent, 'outside.jsonl');
  await writeFile(outside, 'preserve-me\n');
  await symlink(outside, path.join(resultDirectory, 'attempts.jsonl'));
  let calls = 0;
  await assert.rejects(
    runFixedPilot({
      environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
      fetchImpl: async () => { calls += 1; throw new Error('must not fetch'); },
      pilotDirectory,
      resultDirectory,
    }),
    (error) => error.code === 'UNSAFE_RESULT_FILE',
  );
  assert.equal(calls, 0);
  assert.equal(await readFile(outside, 'utf8'), 'preserve-me\n');
});

test('independent metrics count only 24 natural cases and separate no-call controls', () => {
  const callPlan = buildCallPlan(stimuli, permutationPlan);
  const gold = goldDraft;
  const goldById = new Map(gold.cases.map((item) => [item.stimulus_id, item]));
  const results = [];
  const attempts = [];

  for (const [index, call] of callPlan.calls.entries()) {
    const stimulus = callPlan.byId.get(call.stimulus_id);
    const request = buildRequest(stimulus, call.variant);
    const goldRow = goldById.get(call.stimulus_id);
    const result = resultFromGold(stimulus, goldRow, call.variant);
    results.push(result);
    attempts.push({
      sequence: index + 1,
      attempt_id: call.stimulus_id + ':' + call.variant,
      stimulus_id: call.stimulus_id,
      variant: call.variant,
      request_sha256: sha256(request.bodyText),
      intent_recorded_at: '2026-10-15T00:00:00.000Z',
    });
  }

  const baseline = agentBaseline;
  const metrics = computeMetrics({
    stimuli,
    gold,
    results,
    attempts,
    permutationPlan,
    agentBaseline: baseline,
    priceConfig,
    priceSnapshot: priceConfig,
  });
  assert.equal(metrics.natural_page_cases.total, 24);
  assert.equal(metrics.natural_page_cases.exact, 24);
  assert.equal(metrics.natural_page_cases.accuracy, 1);
  assert.equal(metrics.natural_page_cases.observed_status.accuracy, 1);
  assert.equal(metrics.natural_page_cases.observed_status.scored, 24);
  assert.equal(metrics.not_checked_controls.correct_no_call, 8);
  assert.equal(metrics.challenge_cases.exact, 8);
  assert.equal(metrics.option_order.invariant, 8);
  assert.equal(metrics.provenance.all_pass, true);
  assert.equal(metrics.agent_baseline.error_delta_model_minus_baseline, 0);
  assert.equal(metrics.acceptance.pass, true);
  assert.equal(metrics.human_review_time_saving_percent, null);
  assert.equal(metrics.integration_roi_claim, false);

  const notStatedId = 'not-stated-01';
  const notStatedStimulus = stimuli.cases.find((item) => item.stimulus_id === notStatedId);
  const notStatedRequest = buildRequest(notStatedStimulus);
  let observedCompositionError;
  try {
    validateResponse(responseFor(notStatedRequest, 'fixed_dates', NO_EVIDENCE), notStatedStimulus, notStatedRequest);
  } catch (error) {
    observedCompositionError = error;
  }
  assert.equal(observedCompositionError.code, 'POSITIVE_STATUS_WITHOUT_EVIDENCE');
  const originalNotStated = results.find((item) => item.attempt_id === notStatedId + ':base');
  const falsePositiveResult = {
    ...originalNotStated,
    outcome: 'safe_error',
    window_status: observedCompositionError.observedResponse.window_status,
    evidence_id: observedCompositionError.observedResponse.evidence_id,
    evidence: null,
    error_code: observedCompositionError.code,
    usage: observedCompositionError.observedResponse.usage,
  };
  const withObservedFalsePositive = computeMetrics({
    stimuli,
    gold,
    results: results.map((item) => item.attempt_id === notStatedId + ':base' ? falsePositiveResult : item),
    attempts,
    permutationPlan,
    agentBaseline: baseline,
    priceConfig,
    priceSnapshot: priceConfig,
  });
  assert.equal(withObservedFalsePositive.natural_page_cases.exact, 23);
  assert.equal(withObservedFalsePositive.natural_page_cases.coverage, 23);
  assert.equal(withObservedFalsePositive.natural_page_cases.observed_status.scored, 24);
  assert.equal(withObservedFalsePositive.natural_page_cases.observed_status.accuracy, 23 / 24);
  assert.equal(withObservedFalsePositive.natural_page_cases.not_stated_false_positives, 1);
  assert.equal(withObservedFalsePositive.acceptance.observed_not_stated_false_positives, 1);
  assert.equal(withObservedFalsePositive.acceptance.criteria.no_not_stated_false_positives, false);

  const fixedOriginal = results.find((item) => item.attempt_id === 'fixed-01:base');
  const compositionRejected = { ...fixedOriginal, outcome: 'safe_error', evidence_id: {
    type: 'choice', choice: NO_EVIDENCE,
    probabilities: Object.fromEntries(Object.keys(fixedOriginal.evidence_id.probabilities).map((id) => [id, id === NO_EVIDENCE ? 1 : 0])), confidence: 1,
  }, evidence: null, error_code: 'POSITIVE_STATUS_WITHOUT_EVIDENCE' };
  const observedOrder = computeMetrics({ stimuli, gold,
    results: results.map((item) => item.attempt_id === 'fixed-01:base' ? compositionRejected : item),
    attempts, permutationPlan, agentBaseline: baseline, priceConfig, priceSnapshot: priceConfig,
  });
  assert.equal(observedOrder.option_order.observed_status_invariant, 8);
  assert.equal(observedOrder.option_order.invariant, 7);
  assert.equal(observedOrder.acceptance.criteria.option_order_invariant, true);
  assert.equal(observedOrder.provenance.all_pass, false);

  const missing = computeMetrics({
    stimuli,
    gold,
    results: results.filter((item) => item.attempt_id !== 'fixed-01:base'),
    attempts,
    permutationPlan,
    agentBaseline: baseline,
    priceConfig,
    priceSnapshot: priceConfig,
  });
  assert.equal(missing.natural_page_cases.total, 24);
  assert.equal(missing.natural_page_cases.exact, 23);
  assert.equal(missing.natural_page_cases.abstentions_or_missing, 1);
  assert.equal(missing.not_checked_controls.correct_no_call, 8);
  assert.equal(missing.attempt_accounting.unresolved_attempt_ids.length, 1);
  assert.equal(missing.usage.usage_cost_estimate_usd, null);
});

test('non-OK response bodies are canceled before each later planned request', async (t) => {
  const { pilotDirectory, resultDirectory } = await readyTestPilot(t, 'http-errors');
  let calls = 0;
  let cancellations = 0;
  const summary = await runFixedPilot({
    pilotDirectory, resultDirectory,
    environment: { TYPESAFE_API_KEY: 'synthetic-test-key' },
    fetchImpl: async (_url, options) => {
      assert.equal(cancellations, calls);
      calls += 1;
      return { ok: false, status: 503, body: { cancel() {
        cancellations += 1;
        return Promise.resolve();
      } } };
    },
  });
  assert.equal(calls, 40);
  assert.equal(cancellations, 40);
  assert.equal(summary.successful_responses, 0);
  assert.equal(summary.failed_attempts, 40);
  assert.ok(summary.failed_attempt_codes.every((code) => code === 'HTTP_REJECTED'));
  assert.equal(summary.usage_cost_estimate_usd, null);
});
