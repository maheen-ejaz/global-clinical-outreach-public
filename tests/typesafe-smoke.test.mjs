import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REQUEST_TIMEOUT_MS,
  TYPESAFE_ENDPOINT,
  TYPESAFE_MODEL,
  runTypeSafeSmoke,
  runTypeSafeSmokeCli,
} from '../scripts/typesafe-smoke.mjs';

const apiKey = 'local-test-key-do-not-print';

function validPayload(overrides = {}) {
  return {
    model: TYPESAFE_MODEL,
    answers: {
      is_eligible: {
        type: 'noul',
        noul: 0.75,
      },
    },
    usage: {
      input_tokens: 12,
      output_tokens: 4,
    },
    ...overrides,
  };
}

function jsonResponse(body, ok = true) {
  return { ok, async json() { return body; } };
}

test('sends the fixed synthetic request with redirect errors and validates the result', async () => {
  let request;
  const result = await runTypeSafeSmoke({
    environment: { TYPESAFE_API_KEY: apiKey },
    async fetchImpl(url, options) {
      request = { url, options };
      return jsonResponse(validPayload());
    },
  });

  assert.equal(request.url, TYPESAFE_ENDPOINT);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.redirect, 'error');
  assert.equal(request.options.headers.authorization, `Bearer ${apiKey}`);
  assert.equal(request.options.headers.accept, 'application/json');
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(request.options.body), {
    state: 'Fictional programme excerpt: The Synthetic Clinical Observership accepts international medical graduates.',
    model: 'jev-latest',
    questions: {
      is_eligible: {
        type: 'noul',
        instructions: 'Does this fictional programme accept international graduates?',
      },
    },
  });
  assert.deepEqual(result, {
    model: TYPESAFE_MODEL,
    type: 'noul',
    probability: 0.75,
    usage: { input_tokens: 12, output_tokens: 4 },
  });
});

test('rejects missing keys without starting a request and reveals only a fixed code', async () => {
  let fetchCalls = 0;
  let stderr = '';
  const exitCode = await runTypeSafeSmokeCli({
    environment: {},
    fetchImpl() { fetchCalls += 1; },
    stdout: { write() {} },
    stderr: { write(value) { stderr += value; } },
  });

  assert.equal(exitCode, 1);
  assert.equal(fetchCalls, 0);
  assert.equal(stderr, 'TypeSafe development smoke failed: MISSING_TYPESAFE_API_KEY\n');
  assert.equal(stderr.includes(apiKey), false);
});

test('sanitizes errors that echo the API key', async () => {
  let stdout = '';
  let stderr = '';
  const exitCode = await runTypeSafeSmokeCli({
    environment: { TYPESAFE_API_KEY: apiKey },
    async fetchImpl() {
      throw new Error(`upstream diagnostic echoed ${apiKey}`);
    },
    stdout: { write(value) { stdout += value; } },
    stderr: { write(value) { stderr += value; } },
  });

  assert.equal(exitCode, 1);
  assert.equal(stdout, '');
  assert.equal(stderr, 'TypeSafe development smoke failed: REQUEST_FAILED\n');
  assert.equal(stderr.includes(apiKey), false);
});

test('converts the abort deadline into a sanitized timeout failure', async () => {
  let stderr = '';
  const exitCode = await runTypeSafeSmokeCli({
    environment: { TYPESAFE_API_KEY: apiKey },
    timeoutMs: 10,
    fetchImpl(_url, { signal }) {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error(`timeout included ${apiKey}`));
        }, { once: true });
      });
    },
    stdout: { write() {} },
    stderr: { write(value) { stderr += value; } },
  });

  assert.equal(exitCode, 1);
  assert.equal(stderr, 'TypeSafe development smoke failed: REQUEST_TIMEOUT\n');
  assert.equal(stderr.includes(apiKey), false);
  assert.equal(REQUEST_TIMEOUT_MS, 30_000);
});

test('rejects malformed model, type, probability, and usage values', async (t) => {
  const malformed = [
    ['model', validPayload({ model: '' })],
    ['answer type', validPayload({
      answers: { is_eligible: { type: 'text', noul: 0.5 } },
    })],
    ['probability below zero', validPayload({
      answers: { is_eligible: { type: 'noul', noul: -0.01 } },
    })],
    ['probability above one', validPayload({
      answers: { is_eligible: { type: 'noul', noul: 1.01 } },
    })],
    ['non-integer usage', validPayload({
      usage: { input_tokens: 1.5, output_tokens: 4 },
    })],
    ['negative usage', validPayload({
      usage: { input_tokens: 12, output_tokens: -1 },
    })],
    ['usage over the bounded total', validPayload({
      usage: { input_tokens: 8_000, output_tokens: 2_001 },
    })],
    ['unexpected response fields', validPayload({ secret: apiKey })],
  ];

  for (const [name, payload] of malformed) {
    await t.test(name, async () => {
      await assert.rejects(
        runTypeSafeSmoke({
          environment: { TYPESAFE_API_KEY: apiKey },
          async fetchImpl() { return jsonResponse(payload); },
        }),
        (error) => error.code === 'INVALID_RESPONSE' && !error.message.includes(apiKey),
      );
    });
  }
});

test('rejects HTTP errors and invalid JSON without retrying or reading unsafe bodies', async () => {
  let fetchCalls = 0;
  await assert.rejects(
    runTypeSafeSmoke({
      environment: { TYPESAFE_API_KEY: apiKey },
      async fetchImpl() {
        fetchCalls += 1;
        return { ok: false, async json() { throw new Error(apiKey); } };
      },
    }),
    { code: 'HTTP_REJECTED' },
  );
  assert.equal(fetchCalls, 1);

  await assert.rejects(
    runTypeSafeSmoke({
      environment: { TYPESAFE_API_KEY: apiKey },
      async fetchImpl() {
        return { ok: true, async json() { throw new Error(apiKey); } };
      },
    }),
    (error) => error.code === 'INVALID_RESPONSE' && !error.message.includes(apiKey),
  );
});

test('does not accept caller-supplied prompt arguments', async () => {
  let fetchCalls = 0;
  let stderr = '';
  const exitCode = await runTypeSafeSmokeCli({
    args: ['--prompt', apiKey],
    environment: { TYPESAFE_API_KEY: apiKey },
    fetchImpl() { fetchCalls += 1; },
    stdout: { write() {} },
    stderr: { write(value) { stderr += value; } },
  });

  assert.equal(exitCode, 2);
  assert.equal(fetchCalls, 0);
  assert.equal(stderr, 'TypeSafe development smoke failed: ARGUMENTS_NOT_SUPPORTED\n');
  assert.equal(stderr.includes(apiKey), false);
});
