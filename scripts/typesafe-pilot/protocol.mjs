import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PILOT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const RESULT_DIR = path.resolve(PILOT_DIR, '../../typesafe-pilot-results');
export const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
export const MODEL = 'jev-1.13.0';
export const PROTOCOL_ID = 'gco-window-status-synthetic-v2';
export const PROTOCOL_REVISION = 2;
export const ANALYSIS_REVISION = 2;
export const REQUEST_TIMEOUT_MS = 30_000;
export const MAX_REQUESTS = 40;
export const MAX_INPUT_BYTES = 32_000;
export const MAX_REQUEST_INPUT_TOKENS = 32_000;
export const MAX_TOTAL_USAGE_TOKENS_PER_RESPONSE = 10_000;
export const MAX_RESPONSE_BYTES = 64_000;
export const MAX_RUN_USD = 0.10;
export const INPUT_USD_PER_MILLION_TOKENS = 0.042;
export const OUTPUT_USD_PER_MILLION_TOKENS = 0;

export const WINDOW_CRITERIA = Object.freeze({
  fixed_dates: 'A deadline or fixed intake date/window is explicitly stated. This only describes the source text; do not calculate whether a date has passed or infer that the programme is currently open.',
  rolling: 'Applications are explicitly accepted any time or throughout the year, or starts are explicitly monthly. If this conflicts with a fixed intake statement, choose unclear.',
  not_stated: 'A program or apply page was read, but its supplied candidate paragraphs do not state application timing. Candidate omission alone is not proof; use unclear if evidence may be missing or incomplete.',
  unclear: 'The source is incomplete, ambiguous, or contains conflicting fixed-date and rolling statements.',
});

export const NO_EVIDENCE = 'none';

export class PilotError extends Error {
  constructor(code) {
    super(code);
    this.name = 'PilotError';
    this.code = code;
  }
}

export function exactKeys(value, expected) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === expected.length
    && expected.every((key) => Object.hasOwn(value, key));
}

export async function assertSafeLocalFile(filePath) {
  let info;
  try {
    info = await lstat(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw new PilotError('UNSAFE_RESULT_FILE');
  }
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
    throw new PilotError('UNSAFE_RESULT_FILE');
  }
  return true;
}

export async function readSafeLocalFile(filePath) {
  let before;
  try {
    before = await lstat(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw new PilotError('UNSAFE_RESULT_FILE');
  }
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1) {
    throw new PilotError('UNSAFE_RESULT_FILE');
  }
  let handle;
  try {
    handle = await open(filePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const opened = await handle.stat();
    if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== before.dev || opened.ino !== before.ino) {
      throw new PilotError('UNSAFE_RESULT_FILE');
    }
    return await handle.readFile('utf8');
  } catch (error) {
    if (error instanceof PilotError) throw error;
    throw new PilotError('UNSAFE_RESULT_FILE');
  } finally {
    await handle?.close();
  }
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  if (value !== null && typeof value === 'object') {
    return '{' + Object.keys(value).sort()
      .map((key) => JSON.stringify(key) + ':' + stableStringify(value[key]))
      .join(',') + '}';
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function validateStimuli(dataset) {
  if (!exactKeys(dataset, ['version', 'dataset_id', 'label', 'as_of_date', 'cases'])
    || dataset.version !== 1
    || dataset.dataset_id !== 'gco-window-status-synthetic-v1'
    || !Array.isArray(dataset.cases)
    || dataset.cases.length !== 40) {
    throw new PilotError('INVALID_STIMULI');
  }

  const caseIds = new Set();
  const groups = { page: 0, not_checked_control: 0, challenge: 0 };
  for (const stimulus of dataset.cases) {
    if (!stimulus
      || typeof stimulus.stimulus_id !== 'string'
      || caseIds.has(stimulus.stimulus_id)
      || !['page', 'not_checked_control', 'challenge'].includes(stimulus.record_group)
      || typeof stimulus.synthetic !== 'boolean'
      || stimulus.synthetic !== true
      || !Array.isArray(stimulus.pages_read)
      || !Array.isArray(stimulus.pages)
      || !Array.isArray(stimulus.candidate_paragraphs)) {
      throw new PilotError('INVALID_STIMULUS_RECORD');
    }
    caseIds.add(stimulus.stimulus_id);
    groups[stimulus.record_group] += 1;

    const pageMap = new Map();
    for (const page of stimulus.pages) {
      if (!page
        || typeof page.page_id !== 'string'
        || !['program', 'apply'].includes(page.kind)
        || typeof page.source_url !== 'string'
        || !page.source_url.startsWith('https://synthetic.example/')
        || typeof page.text !== 'string'
        || !page.text.trim()
        || pageMap.has(page.page_id)
        || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(page.text)
        || /linkedin\.com/i.test(page.text)) {
        throw new PilotError('INVALID_SYNTHETIC_PAGE');
      }
      pageMap.set(page.page_id, page);
    }

    const listedPageIds = new Set(stimulus.pages_read.map((page) => page.page_id));
    if (listedPageIds.size !== stimulus.pages_read.length
      || stimulus.pages_read.some((page) => !pageMap.has(page.page_id)
        || pageMap.get(page.page_id).kind !== page.kind)
      || listedPageIds.size !== pageMap.size) {
      throw new PilotError('PAGE_READ_METADATA_MISMATCH');
    }

    const candidateIds = new Set();
    for (const candidate of stimulus.candidate_paragraphs) {
      if (!candidate) throw new PilotError('INVALID_CANDIDATE_PARAGRAPH');
      const page = pageMap.get(candidate.page_id);
      if (!candidate
        || typeof candidate.candidate_id !== 'string'
        || candidate.candidate_id === NO_EVIDENCE
        || candidateIds.has(candidate.candidate_id)
        || typeof candidate.paragraph !== 'string'
        || !candidate.paragraph.trim()
        || !page
        || !page.text.includes(candidate.paragraph)) {
        throw new PilotError('INVALID_CANDIDATE_PARAGRAPH');
      }
      candidateIds.add(candidate.candidate_id);
    }

    if (stimulus.record_group === 'not_checked_control'
      && (stimulus.call_policy !== 'no_call_no_program_or_apply_page'
        || pageMap.size !== 0
        || candidateIds.size !== 0)) {
      throw new PilotError('INVALID_NO_CALL_CONTROL');
    }
    if (stimulus.record_group !== 'not_checked_control'
      && stimulus.call_policy !== 'evaluate') {
      throw new PilotError('INVALID_CALL_POLICY');
    }
  }

  if (groups.page !== 24 || groups.not_checked_control !== 8 || groups.challenge !== 8) {
    throw new PilotError('INVALID_STIMULI_GROUP_COUNTS');
  }
  return { caseIds, groups };
}

export function validatePermutationPlan(plan, stimuli) {
  if (!exactKeys(plan, ['version', 'description', 'stimulus_ids'])
    || plan.version !== 1
    || !Array.isArray(plan.stimulus_ids)
    || plan.stimulus_ids.length !== 8
    || new Set(plan.stimulus_ids).size !== 8) {
    throw new PilotError('INVALID_PERMUTATION_PLAN');
  }
  const byId = new Map(stimuli.cases.map((stimulus) => [stimulus.stimulus_id, stimulus]));
  for (const id of plan.stimulus_ids) {
    const stimulus = byId.get(id);
    if (!stimulus || stimulus.call_policy !== 'evaluate' || stimulus.candidate_paragraphs.length === 0) {
      throw new PilotError('INVALID_PERMUTATION_STIMULUS');
    }
  }
  return plan;
}

function evidenceCriteria(stimulus, variant) {
  const ids = stimulus.candidate_paragraphs.map((candidate) => candidate.candidate_id);
  const orderedIds = variant === 'permuted'
    ? [NO_EVIDENCE, ...ids.slice().reverse()]
    : [...ids, NO_EVIDENCE];
  const criteria = {};
  for (const id of orderedIds) {
    criteria[id] = id === NO_EVIDENCE
      ? 'No supplied candidate paragraph directly states application-window timing clearly and unambiguously.'
      : stimulus.candidate_paragraphs.find((candidate) => candidate.candidate_id === id).paragraph;
  }
  return criteria;
}

export function shouldCall(stimulus) {
  if (stimulus.call_policy !== 'evaluate') return false;
  return stimulus.candidate_paragraphs.length > 0;
}

export function buildRequest(stimulus, variant = 'base') {
  if (!stimulus || !shouldCall(stimulus)) {
    throw new PilotError(stimulus?.call_policy === 'no_call_no_program_or_apply_page'
      ? 'NOT_CHECKED_NO_CALL'
      : 'NO_CANDIDATE_NO_UPDATE');
  }
  if (!['base', 'permuted'].includes(variant)) throw new PilotError('INVALID_REQUEST_VARIANT');

  const pagesRead = stimulus.pages_read.map((page) => page.kind);
  if (!pagesRead.some((kind) => kind === 'program' || kind === 'apply')) {
    throw new PilotError('NO_RELEVANT_PAGE_NO_CALL');
  }

  const statusEntries = Object.entries(WINDOW_CRITERIA);
  const statusCriteria = variant === 'permuted'
    ? Object.fromEntries(statusEntries.slice().reverse())
    : Object.fromEntries(statusEntries);
  const candidateCriteria = evidenceCriteria(stimulus, variant);

  const state = {
    synthetic_source_text: true,
    stimulus_id: stimulus.stimulus_id,
    page_kinds_read: pagesRead,
    candidate_paragraphs: stimulus.candidate_paragraphs.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      paragraph: candidate.paragraph,
    })),
  };

  const body = {
    model: MODEL,
    state,
    questions: {
      window_status: {
        type: 'choice',
        instructions: 'Classify the application-window wording using only the supplied synthetic source candidates and page-read kinds. The schema has one status only. If fixed dates and rolling starts overlap or conflict, choose unclear. Do not infer current eligibility, outreach permission, or whether a stated deadline is open now. Do not calculate date arithmetic.',
        criteria: statusCriteria,
      },
      evidence_id: {
        type: 'choice',
        instructions: 'This is a standalone source-evidence selection. Inspect only the supplied candidate paragraphs. Select the single paragraph that explicitly states application-window timing, such as a fixed deadline/intake date or rolling/monthly acceptance. Select none if no candidate directly states application timing or if the timing evidence is ambiguous or conflicting. Never write or invent text, a citation, or a URL.',
        criteria: candidateCriteria,
      },
    },
  };
  const bodyText = JSON.stringify(body);
  if (Buffer.byteLength(bodyText, 'utf8') > MAX_INPUT_BYTES) {
    throw new PilotError('REQUEST_SIZE_LIMIT');
  }
  return { body, bodyText, candidateCriteria, statusCriteria };
}

function validateChoiceAnswer(answer, criteria) {
  const keys = Object.keys(criteria);
  if (!exactKeys(answer, ['type', 'choice', 'probabilities', 'confidence'])
    || answer.type !== 'choice'
    || typeof answer.choice !== 'string'
    || !keys.includes(answer.choice)
    || !exactKeys(answer.probabilities, keys)
    || typeof answer.confidence !== 'number'
    || !Number.isFinite(answer.confidence)
    || answer.confidence < 0
    || answer.confidence > 1) {
    throw new PilotError('INVALID_RESPONSE');
  }
  const probabilities = {};
  let total = 0;
  let maximum = -1;
  for (const key of keys) {
    const probability = answer.probabilities[key];
    if (typeof probability !== 'number'
      || !Number.isFinite(probability)
      || probability < 0
      || probability > 1) {
      throw new PilotError('INVALID_RESPONSE');
    }
    probabilities[key] = probability;
    total += probability;
    maximum = Math.max(maximum, probability);
  }
  if (Math.abs(total - 1) > 0.01 || Math.abs(probabilities[answer.choice] - maximum) > 1e-9) {
    throw new PilotError('INVALID_RESPONSE');
  }
  return { choice: answer.choice, probabilities, confidence: answer.confidence };
}

export function resolveEvidence(stimulus, evidenceId) {
  if (evidenceId === NO_EVIDENCE) return null;
  const candidate = stimulus.candidate_paragraphs.find((item) => item.candidate_id === evidenceId);
  if (!candidate) throw new PilotError('INVALID_EVIDENCE_ID');
  const page = stimulus.pages.find((item) => item.page_id === candidate.page_id);
  if (!page || !page.text.includes(candidate.paragraph)) throw new PilotError('INVALID_EVIDENCE_MAPPING');
  return {
    candidate_id: candidate.candidate_id,
    source_url: page.source_url,
    exact_paragraph: candidate.paragraph,
  };
}

export function validateResponse(response, stimulus, request) {
  if (!exactKeys(response, ['model', 'answers', 'usage'])
    || response.model !== MODEL
    || !exactKeys(response.answers, ['window_status', 'evidence_id'])
    || !exactKeys(response.usage, ['input_tokens', 'output_tokens'])
    || !Number.isSafeInteger(response.usage.input_tokens)
    || response.usage.input_tokens < 0
    || !Number.isSafeInteger(response.usage.output_tokens)
    || response.usage.output_tokens < 0
    || response.usage.input_tokens + response.usage.output_tokens > MAX_TOTAL_USAGE_TOKENS_PER_RESPONSE) {
    throw new PilotError('INVALID_RESPONSE');
  }

  const windowStatus = validateChoiceAnswer(response.answers.window_status, request.statusCriteria);
  const evidenceId = validateChoiceAnswer(response.answers.evidence_id, request.candidateCriteria);
  const usage = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };
  const observedResponse = {
    window_status: windowStatus,
    evidence_id: evidenceId,
    usage,
  };
  let evidence = null;
  if (['fixed_dates', 'rolling'].includes(windowStatus.choice) && evidenceId.choice === NO_EVIDENCE) {
    const error = new PilotError('POSITIVE_STATUS_WITHOUT_EVIDENCE');
    error.observedResponse = observedResponse;
    throw error;
  }
  if (['fixed_dates', 'rolling'].includes(windowStatus.choice)) {
    try {
      evidence = resolveEvidence(stimulus, evidenceId.choice);
    } catch (cause) {
      const error = new PilotError(cause instanceof PilotError ? cause.code : 'INVALID_RESPONSE');
      error.observedResponse = observedResponse;
      throw error;
    }
  }

  return {
    stimulus_id: stimulus.stimulus_id,
    outcome: 'validated',
    model: MODEL,
    window_status: windowStatus,
    evidence_id: evidenceId,
    evidence,
    usage,
    no_update: true,
    requires_human_review: true,
  };
}

export function estimateCost(usage, prices) {
  if (!usage || !prices
    || typeof prices.input_usd_per_million_tokens !== 'number'
    || typeof prices.output_usd_per_million_tokens !== 'number') {
    return null;
  }
  return ((usage.input_tokens * prices.input_usd_per_million_tokens)
    + (usage.output_tokens * prices.output_usd_per_million_tokens)) / 1_000_000;
}

export function buildCallPlan(stimuli, permutationPlan) {
  validateStimuli(stimuli);
  validatePermutationPlan(permutationPlan, stimuli);
  const byId = new Map(stimuli.cases.map((stimulus) => [stimulus.stimulus_id, stimulus]));
  const calls = [];
  const noCalls = [];

  for (const stimulus of stimuli.cases) {
    if (shouldCall(stimulus)) calls.push({ stimulus_id: stimulus.stimulus_id, variant: 'base' });
    else noCalls.push({
      stimulus_id: stimulus.stimulus_id,
      reason: stimulus.call_policy === 'no_call_no_program_or_apply_page'
        ? 'not_checked_no_call'
        : 'no_candidates_manual_review',
    });
  }
  for (const id of permutationPlan.stimulus_ids) {
    const stimulus = byId.get(id);
    if (!shouldCall(stimulus)) throw new PilotError('PERMUTATION_NO_CALL');
    calls.push({ stimulus_id: id, variant: 'permuted' });
  }

  const callIds = calls.map((call) => call.stimulus_id + ':' + call.variant);
  if (calls.length !== 40 || new Set(callIds).size !== calls.length || noCalls.length !== 8) {
    throw new PilotError('INVALID_CALL_PLAN');
  }
  return { calls, noCalls, byId };
}

export async function readJsonLines(filePath) {
  const text = await readSafeLocalFile(filePath);
  if (text === null || !text) return [];
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.some((line) => line.trim() === '')) throw new PilotError('INVALID_LOCAL_LEDGER');
  try {
    return lines.map((line) => JSON.parse(line));
  } catch {
    throw new PilotError('INVALID_LOCAL_LEDGER');
  }
}

export function validateAttempts(attempts) {
  if (!Array.isArray(attempts) || attempts.length > MAX_REQUESTS) throw new PilotError('REQUEST_CAP_REACHED');
  const ids = new Set();
  for (let index = 0; index < attempts.length; index += 1) {
    const item = attempts[index];
    if (!exactKeys(item, ['sequence', 'attempt_id', 'stimulus_id', 'variant', 'request_sha256', 'intent_recorded_at'])
      || item.sequence !== index + 1
      || typeof item.attempt_id !== 'string'
      || ids.has(item.attempt_id)
      || typeof item.stimulus_id !== 'string'
      || !['base', 'permuted'].includes(item.variant)
      || item.attempt_id !== item.stimulus_id + ':' + item.variant
      || typeof item.request_sha256 !== 'string'
      || !/^[a-f0-9]{64}$/.test(item.request_sha256)
      || typeof item.intent_recorded_at !== 'string') {
      throw new PilotError('INVALID_LOCAL_LEDGER');
    }
    ids.add(item.attempt_id);
  }
  return ids;
}

export async function appendAttemptIntent(journalPath, call, requestHash, now = new Date().toISOString()) {
  const attempts = await readJsonLines(journalPath);
  const existing = validateAttempts(attempts);
  const attemptId = call.stimulus_id + ':' + call.variant;
  if (existing.has(attemptId)) throw new PilotError('DUPLICATE_ATTEMPT_REFUSED');
  if (attempts.length >= MAX_REQUESTS) throw new PilotError('REQUEST_CAP_REACHED');

  const record = {
    sequence: attempts.length + 1,
    attempt_id: attemptId,
    stimulus_id: call.stimulus_id,
    variant: call.variant,
    request_sha256: requestHash,
    intent_recorded_at: now,
  };
  await mkdir(path.dirname(journalPath), { recursive: true, mode: 0o700 });
  await assertSafeLocalFile(journalPath);
  let handle;
  try {
    const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0);
    handle = await open(journalPath, flags, 0o600);
    await handle.writeFile(JSON.stringify(record) + '\n', 'utf8');
    await handle.sync();
  } catch {
    throw new PilotError('LOCAL_JOURNAL_WRITE_FAILED');
  } finally {
    await handle?.close();
  }
  return record;
}

export async function acquireRunLock(resultDirectory) {
  await mkdir(resultDirectory, { recursive: true, mode: 0o700 });
  const info = await lstat(resultDirectory).catch(() => null);
  if (!info?.isDirectory() || info.isSymbolicLink()) throw new PilotError('INVALID_RESULT_DIRECTORY');
  const lockPath = path.join(resultDirectory, 'run.lock');
  let handle;
  try {
    handle = await open(lockPath, 'wx', 0o600);
    await handle.writeFile(JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }) + '\n');
    await handle.sync();
  } catch {
    throw new PilotError('PILOT_ALREADY_RUNNING_OR_LOCKED');
  }
  return async () => {
    await handle.close().catch(() => {});
    await rm(lockPath, { force: true }).catch(() => {});
  };
}

export async function appendResult(resultPath, result) {
  const results = await readJsonLines(resultPath);
  if (results.some((item) => item.attempt_id === result.attempt_id)) {
    throw new PilotError('DUPLICATE_RESULT_REFUSED');
  }
  await mkdir(path.dirname(resultPath), { recursive: true, mode: 0o700 });
  await assertSafeLocalFile(resultPath);
  let handle;
  try {
    const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0);
    handle = await open(resultPath, flags, 0o600);
    await handle.writeFile(JSON.stringify(result) + '\n', 'utf8');
    await handle.sync();
  } catch {
    throw new PilotError('LOCAL_RESULT_WRITE_FAILED');
  } finally {
    await handle?.close();
  }
}

export async function writeJsonAtomically(filePath, value) {
  const tempPath = filePath + '.tmp';
  await assertSafeLocalFile(filePath);
  await assertSafeLocalFile(tempPath);
  await writeFile(tempPath, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' })
    .catch((error) => {
      if (error?.code === 'EEXIST') throw new PilotError('LOCAL_OUTPUT_TEMP_EXISTS');
      throw new PilotError('LOCAL_OUTPUT_WRITE_FAILED');
    });
  await rename(tempPath, filePath).catch(async () => {
    await rm(tempPath, { force: true });
    throw new PilotError('LOCAL_OUTPUT_WRITE_FAILED');
  });
}

export function validatePriceConfig(config) {
  if (!exactKeys(config, [
    'review_status',
    'source_url',
    'retrieved_at',
    'input_usd_per_million_tokens',
    'output_usd_per_million_tokens',
    'maximum_run_usd',
  ])
    || config.review_status !== 'parent_verified_live'
    || typeof config.source_url !== 'string'
    || !config.source_url.startsWith('https://')
    || typeof config.retrieved_at !== 'string'
    || typeof config.input_usd_per_million_tokens !== 'number'
    || !Number.isFinite(config.input_usd_per_million_tokens)
    || config.input_usd_per_million_tokens <= 0
    || typeof config.output_usd_per_million_tokens !== 'number'
    || !Number.isFinite(config.output_usd_per_million_tokens)
    || config.output_usd_per_million_tokens < 0
    || typeof config.maximum_run_usd !== 'number'
    || !Number.isFinite(config.maximum_run_usd)
    || config.maximum_run_usd <= 0
    || config.maximum_run_usd > MAX_RUN_USD) {
    throw new PilotError('PRICE_CAP_NOT_CONFIGURED');
  }

  const worstCaseCost = MAX_REQUESTS * MAX_REQUEST_INPUT_TOKENS
    * config.input_usd_per_million_tokens / 1_000_000;
  if (worstCaseCost > config.maximum_run_usd) throw new PilotError('PRICE_CAP_TOO_LOW');
  return { worst_case_input_cost_usd: worstCaseCost };
}

export function safeErrorCode(error) {
  return error instanceof PilotError
    ? error.code
    : 'REQUEST_FAILED';
}
