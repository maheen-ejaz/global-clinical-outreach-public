#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
export const TYPESAFE_MODEL = 'jev-latest';
export const REQUEST_TIMEOUT_MS = 30_000;

const REQUEST_BODY = Object.freeze({
  state: 'Fictional programme excerpt: The Synthetic Clinical Observership accepts international medical graduates.',
  model: TYPESAFE_MODEL,
  questions: Object.freeze({
    is_eligible: Object.freeze({
      type: 'noul',
      instructions: 'Does this fictional programme accept international graduates?',
    }),
  }),
});

const FAILURE_CODES = new Set([
  'ARGUMENTS_NOT_SUPPORTED',
  'MISSING_TYPESAFE_API_KEY',
  'INVALID_CONFIGURATION',
  'REQUEST_TIMEOUT',
  'REQUEST_FAILED',
  'HTTP_REJECTED',
  'INVALID_RESPONSE',
]);
const MAX_TOTAL_USAGE_TOKENS = 10_000;

export class TypeSafeSmokeError extends Error {
  constructor(code) {
    super(FAILURE_CODES.has(code) ? code : 'REQUEST_FAILED');
    this.name = 'TypeSafeSmokeError';
    this.code = FAILURE_CODES.has(code) ? code : 'REQUEST_FAILED';
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, expected) {
  return isRecord(value)
    && Object.keys(value).length === expected.length
    && expected.every((key) => Object.hasOwn(value, key));
}

function validateResponse(value) {
  if (!hasExactKeys(value, ['model', 'answers', 'usage'])) {
    throw new TypeSafeSmokeError('INVALID_RESPONSE');
  }
  if (typeof value.model !== 'string'
    || value.model.trim() === ''
    || value.model.length > 200
    || /[\0-\x1f\x7f]/.test(value.model)) {
    throw new TypeSafeSmokeError('INVALID_RESPONSE');
  }
  if (!hasExactKeys(value.answers, ['is_eligible'])) {
    throw new TypeSafeSmokeError('INVALID_RESPONSE');
  }
  const answer = value.answers.is_eligible;
  if (!hasExactKeys(answer, ['type', 'noul'])
    || answer.type !== 'noul'
    || typeof answer.noul !== 'number'
    || !Number.isFinite(answer.noul)
    || answer.noul < 0
    || answer.noul > 1) {
    throw new TypeSafeSmokeError('INVALID_RESPONSE');
  }
  if (!hasExactKeys(value.usage, ['input_tokens', 'output_tokens'])
    || !Number.isSafeInteger(value.usage.input_tokens)
    || value.usage.input_tokens < 0
    || !Number.isSafeInteger(value.usage.output_tokens)
    || value.usage.output_tokens < 0
    || value.usage.input_tokens + value.usage.output_tokens > MAX_TOTAL_USAGE_TOKENS) {
    throw new TypeSafeSmokeError('INVALID_RESPONSE');
  }

  return {
    model: value.model,
    type: answer.type,
    probability: answer.noul,
    usage: {
      input_tokens: value.usage.input_tokens,
      output_tokens: value.usage.output_tokens,
    },
  };
}

export async function runTypeSafeSmoke({
  environment = process.env,
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const apiKey = environment.TYPESAFE_API_KEY;
  if (typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new TypeSafeSmokeError('MISSING_TYPESAFE_API_KEY');
  }
  if (/[\r\n]/.test(apiKey) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
    throw new TypeSafeSmokeError('INVALID_CONFIGURATION');
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(TYPESAFE_ENDPOINT, {
      method: 'POST',
      redirect: 'error',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(REQUEST_BODY),
      signal: controller.signal,
    });
    if (!response?.ok) throw new TypeSafeSmokeError('HTTP_REJECTED');

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new TypeSafeSmokeError('INVALID_RESPONSE');
    }
    return validateResponse(payload);
  } catch (error) {
    if (timedOut || controller.signal.aborted) {
      throw new TypeSafeSmokeError('REQUEST_TIMEOUT');
    }
    if (error instanceof TypeSafeSmokeError) throw error;
    throw new TypeSafeSmokeError('REQUEST_FAILED');
  } finally {
    clearTimeout(timer);
  }
}

function safeFailureCode(error) {
  return error instanceof TypeSafeSmokeError && FAILURE_CODES.has(error.code)
    ? error.code
    : 'REQUEST_FAILED';
}

export async function runTypeSafeSmokeCli({
  args = process.argv.slice(2),
  environment = process.env,
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  if (args.length !== 0) {
    stderr.write('TypeSafe development smoke failed: ARGUMENTS_NOT_SUPPORTED\n');
    return 2;
  }

  try {
    await runTypeSafeSmoke({ environment, fetchImpl, timeoutMs });
    stdout.write('TypeSafe development smoke passed; model, noul probability, and token usage validated.\n');
    return 0;
  } catch (error) {
    stderr.write(`TypeSafe development smoke failed: ${safeFailureCode(error)}\n`);
    return 1;
  }
}

if (process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runTypeSafeSmokeCli().then((code) => {
    process.exitCode = code;
  });
}
