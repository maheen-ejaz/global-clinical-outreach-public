import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  CANONICAL_PROJECT_ID,
  CONTRACT_VERSION,
  ProfileError,
  buildInfisicalArguments,
  buildInjectionEnvironment,
  buildTargetEnvironment,
  checkHealth,
  createRedactedForwarder,
  runCli,
  runBinding,
  selectBinding,
  signalExitCode,
  superviseChild,
  validateCliVersion,
  validateCommand,
  validateManifest,
  verifyRuntimeFiles,
  verifyTypeSafeSmokeRuntime,
} from './infisical-profile-runner.mjs';

const projectId = CANONICAL_PROJECT_ID;
const binding = { workspaceId: projectId };

function source(path, variables, environment = 'dev') {
  return { environment, path, variables };
}

function validManifest() {
  return {
    schemaVersion: 3,
    contractVersion: CONTRACT_VERSION,
    projectId,
    authentication: { mode: 'user-session' },
    repository: {
      id: 'global-clinical-outreach',
      defaultBranch: 'main',
      origin: 'https://github.com/maheen-ejaz/global-clinical-outreach.git',
    },
    cliVersion: { min: '0.43.125', maxExclusive: '0.44.0' },
    profiles: {
      'dev-web': {
        environment: 'dev',
        paths: [source('/Supabase/samvaya-web-dev-v2', ['NEXT_PUBLIC_SUPABASE_URL'])],
        requiredVariables: ['NEXT_PUBLIC_SUPABASE_URL'],
        purpose: 'Web development',
        runbook: null,
        expand: true,
        commands: ['dev-web'],
      },
      'prod-release': {
        environment: 'prod',
        paths: [source('/Supabase/samvaya-prod-mumbai/release', ['SUPABASE_PROJECT_ID'], 'prod')],
        requiredVariables: ['SUPABASE_PROJECT_ID'],
        purpose: 'Production release verification',
        runbook: 'docs/RELEASE.md',
        expand: false,
        commands: ['prod-release'],
      },
    },
    commands: {
      'dev-web': {
        profile: 'dev-web',
        executable: 'npm',
        arguments: ['run', 'dev'],
        timeoutSeconds: 0,
        passthroughVariables: [],
      },
      'prod-release': {
        profile: 'prod-release',
        executable: 'scripts/verify-production-release.sh',
        arguments: [],
        timeoutSeconds: 600,
        passthroughVariables: [],
      },
    },
  };
}

function response(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get(name) { return headers[name.toLowerCase()] ?? null; } },
    async json() { return body; },
  };
}

function typesafeManifest() {
  const manifest = validManifest();
  manifest.profiles['dev-typesafe'] = {
    environment: 'dev',
    paths: [source('/TypeSafe', ['TYPESAFE_API_KEY'])],
    requiredVariables: ['TYPESAFE_API_KEY'],
    purpose: 'Synthetic TypeSafe development API smoke check',
    runbook: 'docs/typesafe-smoke.md',
    expand: false,
    commands: ['dev-typesafe-smoke'],
  };
  manifest.commands['dev-typesafe-smoke'] = {
    profile: 'dev-typesafe',
    executable: 'node',
    arguments: ['scripts/typesafe-smoke.mjs'],
    timeoutSeconds: 30,
    passthroughVariables: [],
  };
  return manifest;
}

function gitFailure(status = 1) {
  return Object.assign(new Error('git command failed'), { status });
}

function typeSafeRuntimeHarness({
  status = '',
  statusAfterFetch = status,
  ignoredPaths = '',
  head = 'feature-head',
  remote = 'main-head',
  headIsAncestor = false,
  remoteIsAncestor = true,
  modifiedRuntime = false,
} = {}) {
  const calls = [];
  let statusCalls = 0;
  const execFileSyncImpl = (_executable, args, options = {}) => {
    calls.push({ args, options });
    if (args[0] === 'remote' && args[1] === 'get-url') {
      return 'https://github.com/maheen-ejaz/global-clinical-outreach.git\n';
    }
    if (args[0] === 'status') {
      statusCalls += 1;
      return `${statusCalls === 1 ? status : statusAfterFetch}\n`;
    }
    if (args[0] === 'ls-files') return ignoredPaths;
    if (args[0] === 'fetch') return '';
    if (args[0] === 'rev-parse' && args[1] === 'HEAD') return `${head}\n`;
    if (args[0] === 'rev-parse') return `${remote}\n`;
    if (args[0] === 'merge-base' && args[1] === '--is-ancestor') {
      const isAncestor = args[2] === head ? headIsAncestor : remoteIsAncestor;
      if (isAncestor) return '';
      throw gitFailure(1);
    }
    if (args[0] === 'diff') {
      if (modifiedRuntime) throw gitFailure(1);
      return '';
    }
    throw new Error(`Unexpected Git command: ${args[0]}`);
  };
  return { calls, execFileSyncImpl };
}

test('accepts the single-project user-session contract', () => {
  assert.deepEqual(validateManifest(validManifest(), binding), []);
});

test('rejects legacy broker, Machine Identity, profile status, and reference fields', () => {
  const manifest = validManifest();
  manifest.broker = { version: 'v1', sha256: 'a'.repeat(64) };
  manifest.profiles['dev-web'].status = 'prepared';
  manifest.profiles['dev-web'].references = [];
  manifest.profiles['dev-web'].machineIdentity = {
    clientId: '057c67f3-da29-4d97-a1a0-5e1e4f53f0ac',
    projectId: 'b2da7a71-5bbc-4a68-aefb-baf8a203422d',
  };
  const errors = validateManifest(manifest, binding).join(' ');
  assert.match(errors, /manifest:unsupported-field/);
  assert.match(errors, /profiles.dev-web:unsupported-field/);
});

test('requires one signed-in user authentication mode and the tracked project binding', () => {
  const manifest = validManifest();
  manifest.authentication.mode = 'universal-auth';
  assert.match(validateManifest(manifest, binding).join(' '), /authentication:mode/);
  manifest.authentication.mode = 'user-session';
  assert.match(
    validateManifest(manifest, { workspaceId: '00000000-0000-0000-0000-000000000000' }).join(' '),
    /binding-project-mismatch/,
  );
});

test('pins the canonical project, repository identity, and CLI range', () => {
  const projectManifest = validManifest();
  projectManifest.projectId = '00000000-0000-0000-0000-000000000000';
  assert.match(validateManifest(projectManifest, {
    workspaceId: projectManifest.projectId,
  }).join(' '), /manifest:project-id/);

  const repositoryManifest = validManifest();
  repositoryManifest.repository.origin = 'https://github.com/other/repository.git';
  assert.match(validateManifest(repositoryManifest, binding).join(' '), /repository:invalid-origin/);

  const versionManifest = validManifest();
  versionManifest.cliVersion = { min: '0.1.0', maxExclusive: '99.0.0' };
  assert.match(validateManifest(versionManifest, binding).join(' '), /cliVersion:invalid-range/);
});

test('requires exact per-path variable ownership and required inventory', () => {
  const manifest = validManifest();
  manifest.profiles['dev-web'].paths.push(
    source('/Anthropic/web-dev-v2', ['NEXT_PUBLIC_SUPABASE_URL']),
  );
  manifest.profiles['dev-web'].requiredVariables = [];
  const errors = validateManifest(manifest, binding).join(' ');
  assert.match(errors, /duplicate-variable-across-paths/);
  assert.match(errors, /required-variable-mismatch/);
});

test('rejects cross-environment, root, reserved runtime, traversal, and duplicate paths', () => {
  for (const badPath of ['/', '/Runtime/app', '/Runtime/../prod', '/double//slash', '/trailing/']) {
    const manifest = validManifest();
    manifest.profiles['dev-web'].paths[0].path = badPath;
    assert.match(validateManifest(manifest, binding).join(' '), /unsafe-path/, badPath);
  }
  const manifest = validManifest();
  manifest.profiles['dev-web'].paths.push(
    source('/Supabase/samvaya-web-dev-v2', ['ANOTHER_VARIABLE'], 'prod'),
  );
  const errors = validateManifest(manifest, binding).join(' ');
  assert.match(errors, /cross-environment/);
  assert.match(errors, /duplicate-path/);
});

test('rejects authentication and runtime-control variables in a profile', () => {
  for (const variable of [
    'INFISICAL_TOKEN',
    'PATH',
    'NODE_OPTIONS',
    'LD_PRELOAD',
    'DYLD_INSERT_LIBRARIES',
    'HTTPS_PROXY',
  ]) {
    const manifest = validManifest();
    manifest.profiles['dev-web'].paths[0].variables = [variable];
    manifest.profiles['dev-web'].requiredVariables = [variable];
    assert.match(validateManifest(manifest, binding).join(' '), /reserved-variable/, variable);
    assert.throws(
      () => buildTargetEnvironment({
        HOME: '/h',
        PATH: '/b',
        PWD: '/r',
        [variable]: 'unsafe',
      }, '/r', manifest.profiles['dev-web'], manifest.commands['dev-web']),
      /RESERVED_VARIABLE/,
    );
  }
});

test('requires a runbook for production profiles', () => {
  const manifest = validManifest();
  manifest.profiles['prod-release'].runbook = null;
  assert.match(validateManifest(manifest, binding).join(' '), /production-runbook-required/);
});

test('binds TypeSafe smoke only to the development key and preserves the production profile', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../infisical-profiles.json', import.meta.url), 'utf8'),
  );
  const typesafe = manifest.profiles['dev-typesafe'];
  assert.equal(manifest.projectId, projectId);
  assert.equal(typesafe.environment, 'dev');
  assert.deepEqual(typesafe.paths, [{
    environment: 'dev',
    path: '/TypeSafe',
    variables: ['TYPESAFE_API_KEY'],
  }]);
  assert.deepEqual(typesafe.requiredVariables, ['TYPESAFE_API_KEY']);
  assert.equal(typesafe.expand, false);
  assert.deepEqual(typesafe.commands, ['dev-typesafe-smoke', 'dev-typesafe-pilot']);
  assert.deepEqual(manifest.commands['dev-typesafe-smoke'], {
    profile: 'dev-typesafe',
    executable: 'node',
    arguments: ['scripts/typesafe-smoke.mjs'],
    timeoutSeconds: 30,
    passthroughVariables: [],
  });
  assert.deepEqual(manifest.profiles['prod-pipeline'].paths, [{
    environment: 'prod',
    path: '/Production/Pipeline/v1',
    variables: [
      'FIRECRAWL_API_KEY',
      'REOON_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_URL',
    ],
  }]);
  assert.equal(manifest.profiles['prod-pipeline'].expand, false);
});

test('selects only tracked command bindings', () => {
  const manifest = validManifest();
  assert.equal(selectBinding(manifest, 'dev-web').profileName, 'dev-web');
  assert.throws(() => selectBinding(manifest, 'missing'), /COMMAND_NOT_BOUND/);
});

test('rejects shell execution, runtime flags, and credential passthrough', () => {
  for (const command of [
    { profile: 'dev-web', executable: 'env', arguments: [], timeoutSeconds: 1, passthroughVariables: [] },
    { profile: 'dev-web', executable: 'node', arguments: ['--eval=bad'], timeoutSeconds: 1, passthroughVariables: [] },
    { profile: 'dev-web', executable: 'node', arguments: ['safe;bad'], timeoutSeconds: 1, passthroughVariables: [] },
    { profile: 'dev-web', executable: 'node', arguments: [], timeoutSeconds: 1, passthroughVariables: ['API_TOKEN'] },
  ]) {
    assert.notDeepEqual(validateCommand('dev-web', command), []);
  }
});

test('renders one canonical project with repeated vendor paths and no machine token', () => {
  const manifest = validManifest();
  const profile = structuredClone(manifest.profiles['dev-web']);
  profile.paths.push(source('/Anthropic/web-dev-v2', ['ANTHROPIC_API_KEY']));
  profile.requiredVariables.push('ANTHROPIC_API_KEY');
  const args = buildInfisicalArguments('/repo', manifest, profile, 'dev-web', '/repo/scripts/runner.mjs');
  assert.deepEqual(
    args.filter((argument) => argument.startsWith('--path=')),
    ['--path=/Supabase/samvaya-web-dev-v2', '--path=/Anthropic/web-dev-v2'],
  );
  assert.ok(args.includes(`--projectId=${projectId}`));
  assert.ok(args.includes('--include-imports=false'));
  assert.ok(args.includes('--secret-overriding=false'));
  assert.equal(args.some((argument) => /token|client-secret|universal-auth/i.test(argument)), false);
});

test('uses only safe base and declared passthrough variables for Infisical', () => {
  const manifest = validManifest();
  const command = structuredClone(manifest.commands['dev-web']);
  command.passthroughVariables = ['JAVA_HOME'];
  const environment = buildInjectionEnvironment({
    HOME: '/home/test',
    PATH: '/hostile',
    JAVA_HOME: '/java',
    INFISICAL_TOKEN: 'ambient',
    OTHER_SECRET: 'ambient',
  }, '/repo', command);
  assert.equal(environment.PATH.includes('/hostile'), false);
  assert.equal(environment.JAVA_HOME, '/java');
  assert.equal(environment.INFISICAL_TOKEN, undefined);
  assert.equal(environment.OTHER_SECRET, undefined);
});

test('validates and prunes injected variables before target launch', () => {
  const manifest = validManifest();
  const { profile, command } = selectBinding(manifest, 'dev-web');
  const result = buildTargetEnvironment({
    HOME: '/home/test',
    PATH: '/trusted',
    PWD: '/repo',
    INFISICAL_DISABLE_UPDATE_CHECK: 'true',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.test',
  }, '/repo', profile, command);
  assert.equal(result.environment.NEXT_PUBLIC_SUPABASE_URL, 'https://example.test');
  assert.equal(result.environment.INFISICAL_DISABLE_UPDATE_CHECK, undefined);
  assert.throws(
    () => buildTargetEnvironment({
      HOME: '/h',
      PATH: '/b',
      PWD: '/r',
      NEXT_PUBLIC_SUPABASE_URL: '',
    }, '/r', profile, command),
    /REQUIRED_VALUE_MISSING/,
  );
  assert.throws(
    () => buildTargetEnvironment({
      HOME: '/h',
      PATH: '/b',
      PWD: '/r',
      NEXT_PUBLIC_SUPABASE_URL: '${BASE_URL}',
    }, '/r', profile, command),
    /REFERENCE_UNRESOLVED/,
  );
  assert.throws(
    () => buildTargetEnvironment({
      HOME: '/h',
      PATH: '/b',
      PWD: '/r',
      NEXT_PUBLIC_SUPABASE_URL: 'ok',
      SURPRISE_SECRET: 'unexpected',
    }, '/r', profile, command),
    /UNEXPECTED_VARIABLE_NAMES/,
  );
});

test('redacts secret values split across output chunks', () => {
  let output = '';
  const forwarder = createRedactedForwarder(
    { write(value) { output += value; } },
    ['top-secret-value'],
  );
  forwarder.write('prefix top-sec');
  forwarder.write('ret-value suffix');
  forwarder.end();
  assert.equal(output, 'prefix [REDACTED] suffix');
});

test('redacts short, self-overlapping, and cross-stream chunks', () => {
  let output = '';
  const forwarder = createRedactedForwarder(
    { write(value) { output += value; } },
    ['xy', 'aaaa'],
  );
  forwarder.write('xy ');
  forwarder.write('aa');
  forwarder.write('aaa');
  forwarder.end();
  assert.equal(output, '[REDACTED] [REDACTED]a');
});

test('validates the pinned Infisical CLI range', () => {
  assert.equal(
    validateCliVersion(
      'infisical version 0.43.125',
      { min: '0.43.125', maxExclusive: '0.44.0' },
    ),
    '0.43.125',
  );
  assert.throws(
    () => validateCliVersion(
      '0.44.0',
      { min: '0.43.125', maxExclusive: '0.44.0' },
    ),
    /CLI_VERSION_UNSUPPORTED/,
  );
});

test('rejects modified runtime binding files and an unexpected Git origin', () => {
  const context = { root: '/repo', manifest: validManifest() };
  const clean = (_executable, args) => {
    if (args.includes('get-url')) return 'https://github.com/maheen-ejaz/global-clinical-outreach.git\n';
    return '';
  };
  assert.equal(
    verifyRuntimeFiles(context, { HOME: '/h' }, { execFileSyncImpl: clean }),
    true,
  );
  assert.throws(
    () => verifyRuntimeFiles({
      root: '/repo',
      manifest: {
        ...validManifest(),
        repository: {
          ...validManifest().repository,
          origin: 'https://github.com/other/repository.git',
        },
      },
    }, { HOME: '/h' }, { execFileSyncImpl: clean }),
    ProfileError,
  );
  assert.throws(
    () => verifyRuntimeFiles(context, { HOME: '/h' }, {
      execFileSyncImpl(_executable, args) {
        if (args.includes('get-url')) return context.manifest.repository.origin;
        throw new Error('modified');
      },
    }),
    /RUNTIME_BINDING_MODIFIED/,
  );
});

test('TypeSafe guard refreshes the default and protects smoke plus existing runtime files', () => {
  const harness = typeSafeRuntimeHarness();
  const result = verifyTypeSafeSmokeRuntime({
    root: '/repo',
    manifest: typesafeManifest(),
  }, {
    HOME: '/home/test',
    PATH: '/hostile',
    TYPESAFE_API_KEY: 'injected-test-value',
  }, { execFileSyncImpl: harness.execFileSyncImpl });

  assert.equal(result, true);
  const fetchCall = harness.calls.find(({ args }) => args[0] === 'fetch');
  assert.deepEqual(fetchCall.args, [
    'fetch',
    '--no-tags',
    '--no-recurse-submodules',
    '--no-write-fetch-head',
    '--',
    'https://github.com/maheen-ejaz/global-clinical-outreach.git',
    'refs/heads/main:refs/remotes/origin/main',
  ]);
  assert.equal(fetchCall.options.env.TYPESAFE_API_KEY, undefined);
  assert.equal(fetchCall.options.env.GIT_TERMINAL_PROMPT, '0');
  const diffCall = harness.calls.find(({ args }) => args[0] === 'diff');
  assert.deepEqual(diffCall.args.slice(4), [
    '.infisical.json',
    'infisical-profiles.json',
    'package.json',
    'package-lock.json',
    'scripts/infisical-profile-runner.mjs',
    'scripts/typesafe-smoke.mjs',
    'scripts/typesafe-pilot',
  ]);
});

test('TypeSafe guard rejects tracked and untracked work before fetching', () => {
  for (const status of [' M pipeline/example.py', '?? untracked-notes.txt']) {
    const harness = typeSafeRuntimeHarness({ status });
    assert.throws(
      () => verifyTypeSafeSmokeRuntime({
        root: '/repo',
        manifest: typesafeManifest(),
      }, { HOME: '/home/test' }, { execFileSyncImpl: harness.execFileSyncImpl }),
      { code: 'RUNTIME_WORKTREE_DIRTY' },
    );
    assert.equal(harness.calls.some(({ args }) => args[0] === 'fetch'), false);
  }

  const afterFetch = typeSafeRuntimeHarness({ statusAfterFetch: '?? changed-during-fetch.txt' });
  assert.throws(
    () => verifyTypeSafeSmokeRuntime({
      root: '/repo',
      manifest: typesafeManifest(),
    }, { HOME: '/home/test' }, { execFileSyncImpl: afterFetch.execFileSyncImpl }),
    { code: 'RUNTIME_WORKTREE_DIRTY' },
  );
  assert.equal(afterFetch.calls.some(({ args }) => args[0] === 'fetch'), true);
});

test('TypeSafe guard rejects stale and diverged revisions after the default fetch', () => {
  for (const [name, ancestry, expected] of [
    ['stale', { headIsAncestor: true, remoteIsAncestor: false }, 'RUNTIME_CHECKOUT_STALE'],
    ['diverged', { headIsAncestor: false, remoteIsAncestor: false }, 'RUNTIME_CHECKOUT_DIVERGED'],
  ]) {
    const harness = typeSafeRuntimeHarness(ancestry);
    assert.throws(
      () => verifyTypeSafeSmokeRuntime({
        root: '/repo',
        manifest: typesafeManifest(),
      }, { HOME: '/home/test' }, { execFileSyncImpl: harness.execFileSyncImpl }),
      { code: expected },
      name,
    );
    assert.equal(harness.calls.some(({ args }) => args[0] === 'fetch'), true);
  }
});

test('TypeSafe guard rejects ignored sensitive file names without reading contents', () => {
  for (const ignoredPath of [
    '.env.local',
    'secrets/id_rsa',
    'workspace/lib/python3.13/site-packages/certifi/cacert.pem',
    'workspace/playwright-core/lib/server/chromium/snapshot.html',
  ]) {
    const harness = typeSafeRuntimeHarness({ ignoredPaths: `${ignoredPath}\0` });
    assert.throws(
      () => verifyTypeSafeSmokeRuntime({
        root: '/repo',
        manifest: typesafeManifest(),
      }, { HOME: '/home/test' }, { execFileSyncImpl: harness.execFileSyncImpl }),
      { code: 'RUNTIME_IGNORED_SENSITIVE_FILE' },
    );
    const listCall = harness.calls.find(({ args }) => args[0] === 'ls-files');
    assert.ok(listCall.args.includes('--ignored'));
    assert.ok(listCall.args.includes('-z'));
    assert.equal(harness.calls.some(({ args }) => args[0] === 'show' || args[0] === 'cat'), false);
    assert.equal(harness.calls.some(({ args }) => args[0] === 'fetch'), false);
  }
});

test('TypeSafe guard allows only known dependency directories for ignored artifact names', () => {
  const dependencyArtifacts = [
    '.venv/lib/python3.13/site-packages/certifi/cacert.pem',
    'node_modules/playwright-core/lib/server/chromium/snapshot.html',
    'node_modules/playwright/lib/server/utilsBundle.js.snapshots/main.js',
  ];
  const harness = typeSafeRuntimeHarness({
    ignoredPaths: dependencyArtifacts.map((path) => `${path}\0`).join(''),
  });

  assert.equal(verifyTypeSafeSmokeRuntime({
    root: '/repo',
    manifest: typesafeManifest(),
  }, { HOME: '/home/test' }, { execFileSyncImpl: harness.execFileSyncImpl }), true);
  assert.equal(harness.calls.some(({ args }) => args[0] === 'fetch'), true);
});

test('TypeSafe guard rejects changes to the smoke script against the fetched default', () => {
  const harness = typeSafeRuntimeHarness({ modifiedRuntime: true });
  assert.throws(
    () => verifyTypeSafeSmokeRuntime({
      root: '/repo',
      manifest: typesafeManifest(),
    }, { HOME: '/home/test' }, { execFileSyncImpl: harness.execFileSyncImpl }),
    { code: 'RUNTIME_BINDING_MODIFIED' },
  );
  const diffCall = harness.calls.find(({ args }) => args[0] === 'diff');
  assert.ok(diffCall.args.includes('scripts/typesafe-smoke.mjs'));
});

test('fails closed on health outage, cache evidence, stale data, and schema drift', async () => {
  const now = Date.parse('2026-09-07T05:00:00Z');
  await assert.rejects(
    checkHealth(async () => { throw new Error('offline'); }, () => now),
    /HEALTH_UNREACHABLE/,
  );
  await assert.rejects(
    checkHealth(async () => response(503, {}), () => now),
    /HEALTH_FAILED/,
  );
  await assert.rejects(
    checkHealth(
      async () => response(200, { message: 'Ok', date: '2026-09-07T05:00:00Z' }, { age: '2' }),
      () => now,
    ),
    /HEALTH_CACHED/,
  );
  await assert.rejects(
    checkHealth(
      async () => response(200, { message: 'Ok', date: '2026-09-07T04:00:00Z' }),
      () => now,
    ),
    /HEALTH_STALE/,
  );
  await assert.rejects(
    checkHealth(async () => response(200, { status: 'ok' }), () => now),
    /HEALTH_SCHEMA/,
  );
  assert.equal(
    await checkHealth(
      async () => response(200, { message: 'Ok', date: '2026-09-07T05:00:00Z' }),
      () => now,
    ),
    true,
  );
});

test('forwards signals, timeouts, and target exit status', async () => {
  class FakeChild extends EventEmitter {
    killedWith = [];
    kill(signal) { this.killedWith.push(signal); }
  }
  const child = new FakeChild();
  const signals = new EventEmitter();
  const waiting = superviseChild(child, { signalSource: signals });
  signals.emit('SIGINT');
  assert.deepEqual(child.killedWith, ['SIGINT']);
  child.emit('exit', 23, null);
  assert.equal(await waiting, 23);
  assert.equal(signals.listenerCount('SIGINT'), 0);
  assert.equal(signalExitCode('SIGTERM'), 143);

  const timed = new FakeChild();
  const timers = [];
  const timedWait = superviseChild(timed, {
    timeoutSeconds: 1,
    signalSource: new EventEmitter(),
    setTimeoutImpl(fn) { timers.push(fn); return timers.length; },
    clearTimeoutImpl() {},
  });
  timers[0]();
  assert.deepEqual(timed.killedWith, ['SIGTERM']);
  timed.emit('exit', null, 'SIGTERM');
  assert.equal(await timedWait, 124);
});

test('runs the canonical user-session Infisical command after health and version checks', async () => {
  const manifest = validManifest();
  const context = { root: '/repo', manifest };
  class FakeChild extends EventEmitter {
    stdout = { pipe() {} };
    stderr = { pipe() {} };
    kill() {}
  }
  const calls = [];
  const code = await runBinding('dev-web', {
    context,
    environment: { HOME: '/home/test', PATH: '/bin' },
    verifyRuntimeFilesImpl() { calls.push('runtime'); },
    execFileSyncImpl(_executable, args) {
      calls.push(args.join(' '));
      return 'infisical version 0.43.125';
    },
    async fetchImpl() {
      calls.push('health');
      return response(200, { message: 'Ok', date: '2026-09-07T05:00:00Z' });
    },
    now: () => Date.parse('2026-09-07T05:00:00Z'),
    spawnImpl(executable, args, options) {
      calls.push({ executable, args, options });
      const child = new FakeChild();
      queueMicrotask(() => child.emit('exit', 0, null));
      return child;
    },
    signalSource: new EventEmitter(),
  });
  assert.equal(code, 0);
  assert.equal(calls[0], 'runtime');
  assert.equal(calls[1], '--version');
  assert.equal(calls[2], 'health');
  assert.equal(calls[3].executable, 'infisical');
  assert.ok(calls[3].args.includes(`--projectId=${projectId}`));
  assert.equal(calls[3].options.env.INFISICAL_TOKEN, undefined);
});

test('keeps production commands on the existing runtime verification path', async () => {
  class FakeChild extends EventEmitter {
    stdout = { pipe() {} };
    stderr = { pipe() {} };
    kill() {}
  }
  const calls = [];
  const code = await runBinding('prod-release', {
    context: { root: '/repo', manifest: validManifest() },
    environment: { HOME: '/home/test', PATH: '/bin' },
    verifyRuntimeFilesImpl() { calls.push('existing-runtime-guard'); },
    verifyTypeSafeSmokeRuntimeImpl() { calls.push('typesafe-guard'); },
    execFileSyncImpl() { calls.push('infisical-version'); return 'infisical version 0.43.125'; },
    async fetchImpl() {
      calls.push('health');
      return response(200, { message: 'Ok', date: '2026-09-07T05:00:00Z' });
    },
    spawnImpl() {
      calls.push('infisical-run');
      const child = new FakeChild();
      queueMicrotask(() => child.emit('exit', 0, null));
      return child;
    },
    signalSource: new EventEmitter(),
    now: () => Date.parse('2026-09-07T05:00:00Z'),
  });

  assert.equal(code, 0);
  assert.deepEqual(calls, ['existing-runtime-guard', 'infisical-version', 'health', 'infisical-run']);
});

for (const pilotCommand of ['dev-typesafe-smoke', 'dev-typesafe-pilot']) test(`runs the ${pilotCommand} checkout guard before credential access`, async () => {
  class FakeChild extends EventEmitter {
    stdout = { pipe() {} };
    stderr = { pipe() {} };
    kill() {}
  }
  const events = [];
  const manifest = typesafeManifest();
  manifest.commands['dev-typesafe-pilot'] = { ...manifest.commands['dev-typesafe-smoke'], arguments: ['scripts/typesafe-pilot/run-typesafe.mjs'] };
  manifest.profiles['dev-typesafe'].commands.push('dev-typesafe-pilot');
  const code = await runBinding(pilotCommand, {
    context: { root: '/repo', manifest },
    environment: { HOME: '/home/test', PATH: '/bin' },
    verifyTypeSafeSmokeRuntimeImpl() { events.push('checkout-guard'); },
    execFileSyncImpl(_executable, args) {
      events.push(args[0] === '--version' ? 'infisical-version' : 'other-command');
      return 'infisical version 0.43.125';
    },
    async fetchImpl() {
      events.push('health');
      return response(200, { message: 'Ok', date: '2026-09-07T05:00:00Z' });
    },
    spawnImpl() {
      events.push('infisical-run');
      const child = new FakeChild();
      queueMicrotask(() => child.emit('exit', 0, null));
      return child;
    },
    signalSource: new EventEmitter(),
    now: () => Date.parse('2026-09-07T05:00:00Z'),
  });

  assert.equal(code, 0);
  assert.deepEqual(events, ['checkout-guard', 'infisical-version', 'health', 'infisical-run']);
});

for (const pilotCommand of ['dev-typesafe-smoke', 'dev-typesafe-pilot']) test(`guards ${pilotCommand} inside the injected child before key validation`, async () => {
  const events = [];
  const manifest = typesafeManifest();
  manifest.commands['dev-typesafe-pilot'] = { ...manifest.commands['dev-typesafe-smoke'], arguments: ['scripts/typesafe-pilot/run-typesafe.mjs'] };
  manifest.profiles['dev-typesafe'].commands.push('dev-typesafe-pilot');
  await assert.rejects(
    runCli(['__target', pilotCommand], {
      context: { root: '/repo', manifest },
      environment: { HOME: '/home/test', PATH: '/bin' },
      verifyTypeSafeSmokeRuntimeImpl() {
        events.push('checkout-guard');
        throw new ProfileError('RUNTIME_WORKTREE_DIRTY');
      },
      spawnImpl() { events.push('target'); },
    }),
    { code: 'RUNTIME_WORKTREE_DIRTY' },
  );
  assert.deepEqual(events, ['checkout-guard']);
});

test('preflight-only commands cannot launch a target', async () => {
  const manifest = validManifest();
  manifest.commands['dev-web'].execution = 'preflight-only';
  await assert.rejects(
    runBinding('dev-web', {
      context: { root: '/repo', manifest },
      environment: { HOME: '/home/test', PATH: '/bin' },
    }),
    /PREFLIGHT_ONLY/,
  );
});
