#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CONTRACT_VERSION = 'com.goocampus.infisical-profile/v3';
export const INFISICAL_API_URL = 'https://app.infisical.com/api';
export const CANONICAL_PROJECT_ID = '1b056234-5b7a-4d98-87a2-635730076e34';
export const SUPPORTED_CLI_RANGE = {
  min: '0.43.125',
  maxExclusive: '0.44.0',
};

const NAME_RE = /^[a-z][a-z0-9-]{1,62}$/;
const ENVIRONMENT_RE = /^[a-z][a-z0-9-]{0,31}$/;
const VARIABLE_RE = /^[A-Z][A-Z0-9_]*$/;
const SAFE_EXECUTABLE_RE = /^(?:[A-Za-z0-9._@+-]+|[A-Za-z0-9._@+-]+(?:\/[A-Za-z0-9._@+-]+)+)$/;
const UNSAFE_ARGUMENT_RE = /[\0\r\n;&|`$<>]/;
const UNSAFE_RUNTIME_OPTION_RE = /^(?:-[epri]|--(?:eval|print|require|import|loader|experimental-loader|env-file|env-file-if-exists)(?:=|$))/;
const UNRESOLVED_REFERENCE_RE = /\$\{[^}]+\}/;
const AUTHENTICATION_VARIABLE_RE = /^(?:INFISICAL_|LOG_(?:LEVEL|FORMAT|DESTINATION)$)/;
const SECRETISH_VARIABLE_RE = /(?:TOKEN|SECRET|PASSWORD|PRIVATE_KEY|CREDENTIAL|COOKIE|AUTH)/;
const RESERVED_PROFILE_VARIABLE_RE = /^(?:PATH|HOME|PWD|SHELL|USER|TMPDIR|BASH_ENV|ENV|CDPATH|NODE(?:_|$)|LD_|DYLD_|GIT_|NPM_|INFISICAL_|LOG_|(?:HTTP|HTTPS|ALL|NO)_PROXY$|SSL_CERT_(?:FILE|DIR)$)/;
const SAFE_PASSTHROUGH = new Set([
  'OUTREACH_BATCH',
  'OUTREACH_DOMAIN',
  'OUTREACH_PAGES',
  'OUTREACH_REFRESH',
  'ANDROID_HOME',
  'ANDROID_SDK_ROOT',
  'HOME',
  'JAVA_HOME',
  'LANG',
  'LC_ALL',
  'SHELL',
  'TERM',
  'TMPDIR',
  'USER',
]);
const BASE_ENVIRONMENT_KEYS = new Set([
  'HOME',
  'LANG',
  'LC_ALL',
  'PATH',
  'PWD',
  'SHELL',
  'TERM',
  'TMPDIR',
  'USER',
]);
const FORBIDDEN_EXECUTABLES = new Set([
  'bash', 'dash', 'env', 'export', 'fish', 'ksh', 'printenv', 'pwsh', 'set', 'sh', 'zsh',
]);
const TOP_LEVEL_KEYS = new Set([
  'schemaVersion',
  'contractVersion',
  'projectId',
  'authentication',
  'repository',
  'cliVersion',
  'profiles',
  'commands',
]);
const AUTHENTICATION_KEYS = new Set(['mode']);
const REPOSITORY_KEYS = new Set(['id', 'defaultBranch', 'origin']);
const CLI_VERSION_KEYS = new Set(['min', 'maxExclusive']);
const PROFILE_KEYS = new Set([
  'environment',
  'paths',
  'requiredVariables',
  'purpose',
  'runbook',
  'expand',
  'commands',
]);
const SOURCE_KEYS = new Set(['environment', 'path', 'variables']);
const COMMAND_KEYS = new Set([
  'profile',
  'executable',
  'arguments',
  'timeoutSeconds',
  'passthroughVariables',
  'execution',
]);
const PROTECTED_RUNTIME_FILES = [
  '.infisical.json',
  'infisical-profiles.json',
  'package.json',
  'package-lock.json',
  'scripts/infisical-profile-runner.mjs',
];
const TYPE_SAFE_COMMANDS = new Set(['dev-typesafe-smoke', 'dev-typesafe-pilot']);
const TYPE_SAFE_SMOKE_PROTECTED_FILES = [
  ...PROTECTED_RUNTIME_FILES,
  'scripts/typesafe-smoke.mjs',
  'scripts/typesafe-pilot',
];
const SAFE_IGNORED_DEPENDENCY_DIRECTORY_RE = /^(?:node_modules|\.venv)(?:\/|$)/;
const SENSITIVE_IGNORED_PATH_RE = /(?:^|\/)(?:\.env(?:\.[^/]*)?|[^/]*(?:backup|recovery|snapshot)[^/]*|[^/]*(?:private[-_]?key|service[-_]?account)[^/]*|id_(?:rsa|dsa|ecdsa|ed25519)|[^/]+\.(?:p8|p12|pfx|pem|key))(?:$|\/)/i;
const SENSITIVE_IGNORED_PATHSPECS = [
  ':(glob)**/.env*',
  ':(glob)**/*backup*',
  ':(glob)**/*recovery*',
  ':(glob)**/*snapshot*',
  ':(glob)**/*private-key*',
  ':(glob)**/*private_key*',
  ':(glob)**/*service-account*',
  ':(glob)**/*service_account*',
  ':(glob)**/id_rsa',
  ':(glob)**/id_dsa',
  ':(glob)**/id_ecdsa',
  ':(glob)**/id_ed25519',
  ':(glob)**/*.p8',
  ':(glob)**/*.p12',
  ':(glob)**/*.pfx',
  ':(glob)**/*.pem',
  ':(glob)**/*.key',
];
const SIGNAL_NUMBERS = { SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGKILL: 9, SIGTERM: 15 };
const GIT_EXECUTABLE = '/usr/bin/git';
const TRUSTED_REPOSITORIES = new Map([
  ['global-clinical-outreach', {
    defaultBranch: 'main',
    origin: 'https://github.com/maheen-ejaz/global-clinical-outreach.git',
  }],
]);
const TRUSTED_PATH = [...new Set([
  dirname(process.execPath),
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin',
])].join(':');

export class ProfileError extends Error {
  constructor(code, names = []) {
    super(code);
    this.name = 'ProfileError';
    this.code = code;
    this.names = names.filter(
      (name) => typeof name === 'string' && /^[A-Za-z0-9_./:@+-]+$/.test(name),
    );
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unsupportedKeys(value, allowed, label, errors) {
  if (!isObject(value)) return;
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    errors.push(`${label}:unsupported-field`);
  }
}

function safeTrackedScript(value, extension) {
  return typeof value === 'string'
    && value.startsWith('scripts/')
    && value.endsWith(extension)
    && /^[A-Za-z0-9._/-]+$/.test(value)
    && !value.includes('..')
    && !value.includes('//');
}

function approvedExecutionShape(executable, args) {
  if (!Array.isArray(args)) return false;
  if (executable === 'npm') {
    return args.length === 2 && args[0] === 'run' && /^[a-z0-9][a-z0-9:-]*$/.test(args[1]);
  }
  if (executable === 'node') return args.length === 1 && safeTrackedScript(args[0], '.mjs');
  if (executable === 'node_modules/.bin/tsx') {
    return args.length === 1 && safeTrackedScript(args[0], '.ts');
  }
  if (executable === 'eas') {
    return args.join('\0')
      === ['build', '--profile', 'production', '--platform', 'all', '--non-interactive'].join('\0');
  }
  return safeTrackedScript(executable, '.sh') && args.length === 0;
}

function safePath(value) {
  return typeof value === 'string'
    && /^\/[A-Za-z0-9._~/-]+$/.test(value)
    && value !== '/'
    && !value.includes('//')
    && !value.includes('..')
    && !value.startsWith('/Runtime/')
    && !value.endsWith('/');
}

function safeMetadata(value) {
  return typeof value === 'string'
    && value.trim() !== ''
    && value.length <= 240
    && !/[\0\r\n]/.test(value)
    && !/(?:st\.|sk_|sb_|gh[pousr]_|github_pat_|xox[baprs]-|eyJ[A-Za-z0-9_-]+\.)/.test(value);
}

function validateVariableList(value, label, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${label}:must-be-array`);
    return [];
  }
  const seen = new Set();
  for (const variable of value) {
    if (typeof variable !== 'string' || !VARIABLE_RE.test(variable)) {
      errors.push(`${label}:invalid-name`);
    } else if (seen.has(variable)) {
      errors.push(`${label}:duplicate-name`);
    } else {
      seen.add(variable);
    }
  }
  return [...seen];
}

function validateSources(value, profileName, environment, errors) {
  if (!Array.isArray(value)) {
    errors.push(`profiles.${profileName}.paths:must-be-array`);
    return [];
  }
  const paths = new Set();
  const variables = new Set();
  const normalized = [];
  for (const source of value) {
    if (!isObject(source)) {
      errors.push(`profiles.${profileName}.paths:invalid-source`);
      continue;
    }
    unsupportedKeys(source, SOURCE_KEYS, `profiles.${profileName}.paths`, errors);
    if (source.environment !== environment) {
      errors.push(`profiles.${profileName}.paths:cross-environment`);
    }
    if (!safePath(source.path)) errors.push(`profiles.${profileName}.paths:unsafe-path`);
    if (paths.has(source.path)) errors.push(`profiles.${profileName}.paths:duplicate-path`);
    paths.add(source.path);
    const sourceVariables = validateVariableList(
      source.variables,
      `profiles.${profileName}.paths.variables`,
      errors,
    );
    for (const variable of sourceVariables) {
      if (RESERVED_PROFILE_VARIABLE_RE.test(variable)) {
        errors.push(`profiles.${profileName}:reserved-variable`);
      }
      if (variables.has(variable)) {
        errors.push(`profiles.${profileName}.paths:duplicate-variable-across-paths`);
      }
      variables.add(variable);
    }
    normalized.push({
      environment: source.environment,
      path: source.path,
      variables: sourceVariables,
    });
  }
  return normalized;
}

export function validateCommand(commandName, command, errors = []) {
  if (!NAME_RE.test(commandName)) errors.push('commands:invalid-name');
  if (!isObject(command)) {
    errors.push(`commands.${commandName}:must-be-object`);
    return errors;
  }
  unsupportedKeys(command, COMMAND_KEYS, `commands.${commandName}`, errors);
  if (!NAME_RE.test(command.profile ?? '')) {
    errors.push(`commands.${commandName}:invalid-profile`);
  }
  if (typeof command.executable !== 'string'
    || !SAFE_EXECUTABLE_RE.test(command.executable)
    || command.executable.includes('..')) {
    errors.push(`commands.${commandName}:unsafe-executable`);
  } else if (FORBIDDEN_EXECUTABLES.has(command.executable.split('/').at(-1))) {
    errors.push(`commands.${commandName}:forbidden-executable`);
  }
  if (!Array.isArray(command.arguments)) {
    errors.push(`commands.${commandName}:arguments-must-be-array`);
  } else {
    for (const argument of command.arguments) {
      if (typeof argument !== 'string'
        || argument.length > 500
        || UNSAFE_ARGUMENT_RE.test(argument)
        || UNSAFE_RUNTIME_OPTION_RE.test(argument)
        || /^[A-Z][A-Z0-9_]*=/.test(argument)) {
        errors.push(`commands.${commandName}:unsafe-argument`);
      }
    }
  }
  if (!approvedExecutionShape(command.executable, command.arguments)) {
    errors.push(`commands.${commandName}:unapproved-execution-shape`);
  }
  if (!Number.isInteger(command.timeoutSeconds)
    || command.timeoutSeconds < 0
    || command.timeoutSeconds > 900) {
    errors.push(`commands.${commandName}:invalid-timeout`);
  }
  const passthrough = validateVariableList(
    command.passthroughVariables,
    `commands.${commandName}.passthroughVariables`,
    errors,
  );
  for (const variable of passthrough) {
    if (!SAFE_PASSTHROUGH.has(variable) || SECRETISH_VARIABLE_RE.test(variable)) {
      errors.push(`commands.${commandName}:unsafe-passthrough`);
    }
  }
  if (command.execution !== undefined
    && !['execute', 'preflight-only'].includes(command.execution)) {
    errors.push(`commands.${commandName}:invalid-execution`);
  }
  return errors;
}

export function validateManifest(manifest, binding) {
  const errors = [];
  if (!isObject(manifest)) return ['manifest:must-be-object'];
  unsupportedKeys(manifest, TOP_LEVEL_KEYS, 'manifest', errors);
  if (manifest.schemaVersion !== 3) errors.push('manifest:schema-version');
  if (manifest.contractVersion !== CONTRACT_VERSION) errors.push('manifest:contract-version');
  if (manifest.projectId !== CANONICAL_PROJECT_ID) {
    errors.push('manifest:project-id');
  }
  if (!isObject(binding) || binding.workspaceId !== manifest.projectId) {
    errors.push('manifest:binding-project-mismatch');
  }
  if (!isObject(manifest.authentication)) {
    errors.push('authentication:must-be-object');
  } else {
    unsupportedKeys(manifest.authentication, AUTHENTICATION_KEYS, 'authentication', errors);
    if (manifest.authentication.mode !== 'user-session') {
      errors.push('authentication:mode');
    }
  }
  if (!isObject(manifest.repository)) {
    errors.push('repository:must-be-object');
  } else {
    unsupportedKeys(manifest.repository, REPOSITORY_KEYS, 'repository', errors);
    const trusted = TRUSTED_REPOSITORIES.get(manifest.repository.id);
    if (!trusted) errors.push('repository:invalid-id');
    if (manifest.repository.defaultBranch !== trusted?.defaultBranch) {
      errors.push('repository:invalid-default-branch');
    }
    if (manifest.repository.origin !== trusted?.origin) errors.push('repository:invalid-origin');
  }
  if (!isObject(manifest.cliVersion)) {
    errors.push('cliVersion:must-be-object');
  } else {
    unsupportedKeys(manifest.cliVersion, CLI_VERSION_KEYS, 'cliVersion', errors);
    const minimum = parseSemver(manifest.cliVersion.min);
    const maximum = parseSemver(manifest.cliVersion.maxExclusive);
    if (!minimum
      || !maximum
      || compareSemver(minimum, maximum) >= 0
      || manifest.cliVersion.min !== SUPPORTED_CLI_RANGE.min
      || manifest.cliVersion.maxExclusive !== SUPPORTED_CLI_RANGE.maxExclusive) {
      errors.push('cliVersion:invalid-range');
    }
  }
  if (!isObject(manifest.profiles) || Object.keys(manifest.profiles).length === 0) {
    errors.push('profiles:must-be-nonempty-object');
  }
  if (!isObject(manifest.commands) || Object.keys(manifest.commands).length === 0) {
    errors.push('commands:must-be-nonempty-object');
  }

  const commandNames = new Set(Object.keys(manifest.commands ?? {}));
  for (const [commandName, command] of Object.entries(manifest.commands ?? {})) {
    validateCommand(commandName, command, errors);
  }

  const boundCommands = new Set();
  for (const [profileName, profile] of Object.entries(manifest.profiles ?? {})) {
    if (!NAME_RE.test(profileName)) errors.push('profiles:invalid-name');
    if (!isObject(profile)) {
      errors.push(`profiles.${profileName}:must-be-object`);
      continue;
    }
    unsupportedKeys(profile, PROFILE_KEYS, `profiles.${profileName}`, errors);
    if (!ENVIRONMENT_RE.test(profile.environment ?? '')) {
      errors.push(`profiles.${profileName}:invalid-environment`);
    }
    const sources = validateSources(profile.paths, profileName, profile.environment, errors);
    if (sources.length === 0) errors.push(`profiles.${profileName}:missing-paths`);
    const requiredVariables = validateVariableList(
      profile.requiredVariables,
      `profiles.${profileName}.requiredVariables`,
      errors,
    );
    const sourceVariables = [...new Set(sources.flatMap((source) => source.variables))].sort();
    if (requiredVariables.slice().sort().join('\0') !== sourceVariables.join('\0')) {
      errors.push(`profiles.${profileName}:required-variable-mismatch`);
    }
    if (!safeMetadata(profile.purpose)) errors.push(`profiles.${profileName}:invalid-purpose`);
    if (profile.runbook !== null
      && (typeof profile.runbook !== 'string'
        || !/^[A-Za-z0-9._/-]+$/.test(profile.runbook)
        || profile.runbook.includes('..'))) {
      errors.push(`profiles.${profileName}:invalid-runbook`);
    }
    if (profile.environment === 'prod' && !profile.runbook) {
      errors.push(`profiles.${profileName}:production-runbook-required`);
    }
    if (typeof profile.expand !== 'boolean') {
      errors.push(`profiles.${profileName}:expand-must-be-boolean`);
    }
    if (!Array.isArray(profile.commands) || profile.commands.length === 0) {
      errors.push(`profiles.${profileName}:commands-must-be-nonempty`);
    } else {
      const localCommands = new Set();
      for (const commandName of profile.commands) {
        if (!NAME_RE.test(commandName ?? '') || !commandNames.has(commandName)) {
          errors.push(`profiles.${profileName}:unknown-command`);
        } else if (localCommands.has(commandName)) {
          errors.push(`profiles.${profileName}:duplicate-command`);
        } else if (manifest.commands[commandName]?.profile !== profileName) {
          errors.push(`profiles.${profileName}:command-profile-mismatch`);
        }
        localCommands.add(commandName);
        boundCommands.add(commandName);
      }
    }
  }
  for (const commandName of commandNames) {
    if (!manifest.profiles?.[manifest.commands[commandName]?.profile]) {
      errors.push(`commands.${commandName}:unknown-profile`);
    }
    if (!boundCommands.has(commandName)) errors.push(`commands.${commandName}:unbound-command`);
  }
  return errors;
}

export function parseSemver(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(?:infisical version )?(\d+)\.(\d+)\.(\d+)$/);
  return match ? match.slice(1).map(Number) : null;
}

export function compareSemver(left, right) {
  const a = Array.isArray(left) ? left : parseSemver(left);
  const b = Array.isArray(right) ? right : parseSemver(right);
  if (!a || !b) throw new ProfileError('CLI_VERSION_SCHEMA');
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return 0;
}

export function validateCliVersion(output, range) {
  const version = parseSemver(String(output).trim());
  if (!version) throw new ProfileError('CLI_VERSION_SCHEMA');
  if (compareSemver(version, range.min) < 0
    || compareSemver(version, range.maxExclusive) >= 0) {
    throw new ProfileError('CLI_VERSION_UNSUPPORTED');
  }
  return version.join('.');
}

export function gitEnvironment(ambient, root) {
  const result = {
    HOME: ambient.HOME || '',
    PATH: TRUSTED_PATH,
    PWD: root,
  };
  for (const key of ['LANG', 'LC_ALL', 'TMPDIR', 'USER']) {
    if (ambient[key] !== undefined) result[key] = ambient[key];
  }
  return result;
}

function gitOutput(root, args, ambient = process.env, execFileSyncImpl = execFileSync) {
  try {
    return execFileSyncImpl(GIT_EXECUTABLE, args, {
      cwd: root,
      encoding: 'utf8',
      env: gitEnvironment(ambient, root),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    throw new ProfileError('REPOSITORY_IDENTITY_FAILED');
  }
}

export function loadContext(requestedRoot = process.cwd()) {
  if (!resolve(requestedRoot).startsWith('/')) throw new ProfileError('REPOSITORY_ROOT_NOT_ABSOLUTE');
  const root = realpathSync(resolve(requestedRoot));
  const moduleRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  if (root !== moduleRoot) throw new ProfileError('REPOSITORY_ROOT_MISMATCH');
  const manifestPath = resolve(root, 'infisical-profiles.json');
  const bindingPath = resolve(root, '.infisical.json');
  if (!existsSync(manifestPath) || !existsSync(bindingPath)) {
    throw new ProfileError('REPOSITORY_BINDING_MISSING');
  }
  if (lstatSync(manifestPath).isSymbolicLink() || lstatSync(bindingPath).isSymbolicLink()) {
    throw new ProfileError('REPOSITORY_BINDING_SYMLINK');
  }
  const gitRoot = realpathSync(gitOutput(root, ['rev-parse', '--show-toplevel']));
  if (gitRoot !== root) throw new ProfileError('REPOSITORY_ROOT_MISMATCH');
  for (const file of PROTECTED_RUNTIME_FILES) {
    gitOutput(root, ['ls-files', '--error-unmatch', '--', file]);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const binding = JSON.parse(readFileSync(bindingPath, 'utf8'));
  const errors = validateManifest(manifest, binding);
  if (errors.length > 0) throw new ProfileError('PROFILE_SCHEMA', errors);
  return { root, manifest, binding };
}

export function loadRepositoryContext(options = {}) {
  return loadContext(options.cwd ?? process.cwd());
}

export function verifyRuntimeFiles(context, ambient = process.env, options = {}) {
  const execFileSyncImpl = options.execFileSyncImpl ?? execFileSync;
  const origin = gitOutput(
    context.root,
    ['remote', 'get-url', 'origin'],
    ambient,
    execFileSyncImpl,
  );
  if (origin !== context.manifest.repository.origin) {
    throw new ProfileError('REPOSITORY_ORIGIN_MISMATCH');
  }
  const trusted = TRUSTED_REPOSITORIES.get(context.manifest.repository.id);
  if (!trusted) throw new ProfileError('REPOSITORY_IDENTITY_FAILED');
  const remoteRef = `refs/remotes/origin/${trusted.defaultBranch}`;
  try {
    execFileSyncImpl(GIT_EXECUTABLE, [
      'diff',
      '--quiet',
      remoteRef,
      '--',
      ...PROTECTED_RUNTIME_FILES,
    ], {
      cwd: context.root,
      env: gitEnvironment(ambient, context.root),
      stdio: 'ignore',
    });
  } catch {
    throw new ProfileError('RUNTIME_BINDING_MODIFIED');
  }
  return true;
}

function verifyTypeSafeSmokeOrigin(context, ambient, execFileSyncImpl) {
  const origin = gitOutput(
    context.root,
    ['remote', 'get-url', 'origin'],
    ambient,
    execFileSyncImpl,
  );
  if (origin !== context.manifest.repository.origin) {
    throw new ProfileError('REPOSITORY_ORIGIN_MISMATCH');
  }
}

function assertTypeSafeSmokeWorktreeClean(context, ambient, execFileSyncImpl) {
  const status = gitOutput(
    context.root,
    ['status', '--porcelain=v1', '--untracked-files=all'],
    ambient,
    execFileSyncImpl,
  );
  if (status !== '') throw new ProfileError('RUNTIME_WORKTREE_DIRTY');
}

function rejectIgnoredTypeSafeSensitivePaths(context, ambient, execFileSyncImpl) {
  const ignoredPaths = gitOutput(
    context.root,
    [
      'ls-files', '--others', '--ignored', '--exclude-standard', '-z', '--',
      ...SENSITIVE_IGNORED_PATHSPECS,
    ],
    ambient,
    execFileSyncImpl,
  ).split('\0').filter(Boolean);
  if (ignoredPaths.some((path) => !SAFE_IGNORED_DEPENDENCY_DIRECTORY_RE.test(path)
    && SENSITIVE_IGNORED_PATH_RE.test(`/${path}`))) {
    throw new ProfileError('RUNTIME_IGNORED_SENSITIVE_FILE');
  }
}

function typeSafeSmokeAncestor(ancestor, descendant, context, ambient, execFileSyncImpl) {
  try {
    execFileSyncImpl(GIT_EXECUTABLE, [
      'merge-base', '--is-ancestor', ancestor, descendant,
    ], {
      cwd: context.root,
      env: gitEnvironment(ambient, context.root),
      stdio: 'ignore',
    });
    return true;
  } catch (error) {
    if (error?.status === 1) return false;
    throw new ProfileError('RUNTIME_DEFAULT_RELATIONSHIP_FAILED');
  }
}

export function verifyTypeSafeSmokeRuntime(context, ambient = process.env, options = {}) {
  const execFileSyncImpl = options.execFileSyncImpl ?? execFileSync;
  verifyTypeSafeSmokeOrigin(context, ambient, execFileSyncImpl);
  assertTypeSafeSmokeWorktreeClean(context, ambient, execFileSyncImpl);
  rejectIgnoredTypeSafeSensitivePaths(context, ambient, execFileSyncImpl);

  const trusted = TRUSTED_REPOSITORIES.get(context.manifest.repository.id);
  if (!trusted) throw new ProfileError('REPOSITORY_IDENTITY_FAILED');
  const branch = trusted.defaultBranch;
  const remoteRef = `refs/remotes/origin/${branch}`;
  const refspec = `refs/heads/${branch}:${remoteRef}`;
  try {
    execFileSyncImpl(GIT_EXECUTABLE, [
      'fetch',
      '--no-tags',
      '--no-recurse-submodules',
      '--no-write-fetch-head',
      '--',
      context.manifest.repository.origin,
      refspec,
    ], {
      cwd: context.root,
      env: {
        ...gitEnvironment(ambient, context.root),
        GIT_TERMINAL_PROMPT: '0',
        GCM_INTERACTIVE: 'Never',
        GIT_ASKPASS: '/usr/bin/false',
        SSH_ASKPASS: '/usr/bin/false',
      },
      stdio: 'ignore',
      timeout: options.fetchTimeoutMs ?? 30_000,
    });
  } catch {
    throw new ProfileError('RUNTIME_DEFAULT_REFRESH_FAILED', [branch]);
  }

  assertTypeSafeSmokeWorktreeClean(context, ambient, execFileSyncImpl);
  rejectIgnoredTypeSafeSensitivePaths(context, ambient, execFileSyncImpl);
  const head = gitOutput(context.root, ['rev-parse', 'HEAD'], ambient, execFileSyncImpl);
  const remote = gitOutput(context.root, ['rev-parse', remoteRef], ambient, execFileSyncImpl);
  if (head !== remote) {
    const headIsAncestor = typeSafeSmokeAncestor(head, remoteRef, context, ambient, execFileSyncImpl);
    const defaultIsAncestor = typeSafeSmokeAncestor(remoteRef, head, context, ambient, execFileSyncImpl);
    if (headIsAncestor) throw new ProfileError('RUNTIME_CHECKOUT_STALE', [branch]);
    if (!defaultIsAncestor) throw new ProfileError('RUNTIME_CHECKOUT_DIVERGED', [branch]);
  }

  try {
    execFileSyncImpl(GIT_EXECUTABLE, [
      'diff',
      '--quiet',
      remoteRef,
      '--',
      ...TYPE_SAFE_SMOKE_PROTECTED_FILES,
    ], {
      cwd: context.root,
      env: gitEnvironment(ambient, context.root),
      stdio: 'ignore',
    });
  } catch {
    throw new ProfileError('RUNTIME_BINDING_MODIFIED');
  }
  return true;
}

export function selectBinding(manifest, commandName) {
  const command = manifest.commands?.[commandName];
  if (!command) throw new ProfileError('COMMAND_NOT_BOUND', [commandName]);
  const profile = manifest.profiles?.[command.profile];
  if (!profile) throw new ProfileError('PROFILE_NOT_FOUND', [command.profile]);
  return { command, profile, profileName: command.profile };
}

export function buildInfisicalArguments(
  root,
  manifest,
  profile,
  commandName,
  runnerPath = resolve(root, 'scripts/infisical-profile-runner.mjs'),
  mode = '__target',
) {
  return [
    'run',
    `--domain=${INFISICAL_API_URL}`,
    '--log-level=error',
    '--silent',
    `--project-config-dir=${root}`,
    `--projectId=${manifest.projectId}`,
    `--env=${profile.environment}`,
    ...profile.paths.map((source) => `--path=${source.path}`),
    '--recursive=false',
    `--expand=${profile.expand ? 'true' : 'false'}`,
    '--include-imports=false',
    '--secret-overriding=false',
    '--',
    process.execPath,
    runnerPath,
    mode,
    commandName,
  ];
}

export function buildInjectionEnvironment(ambient, root, command) {
  const environment = {
    HOME: ambient.HOME || '',
    PATH: TRUSTED_PATH,
    PWD: root,
    INFISICAL_DISABLE_UPDATE_CHECK: 'true',
  };
  for (const key of ['LANG', 'LC_ALL', 'SHELL', 'TERM', 'TMPDIR', 'USER']) {
    if (ambient[key] !== undefined) environment[key] = ambient[key];
  }
  for (const key of command.passthroughVariables) {
    if (ambient[key] !== undefined) environment[key] = ambient[key];
  }
  return environment;
}

export function buildTargetEnvironment(ambient, root, profile, command) {
  const reserved = profile.requiredVariables.filter(
    (variable) => RESERVED_PROFILE_VARIABLE_RE.test(variable),
  );
  if (reserved.length > 0) throw new ProfileError('RESERVED_VARIABLE', reserved);
  const allowed = new Set([
    ...BASE_ENVIRONMENT_KEYS,
    ...profile.requiredVariables,
    ...command.passthroughVariables,
    'INFISICAL_DISABLE_UPDATE_CHECK',
  ]);
  const unexpected = Object.keys(ambient)
    .filter((key) => VARIABLE_RE.test(key))
    .filter((key) => !allowed.has(key))
    .filter((key) => !AUTHENTICATION_VARIABLE_RE.test(key))
    .sort();
  if (unexpected.length > 0) throw new ProfileError('UNEXPECTED_VARIABLE_NAMES', unexpected);

  const environment = {
    HOME: ambient.HOME || '',
    PATH: TRUSTED_PATH,
    PWD: root,
  };
  for (const key of ['LANG', 'LC_ALL', 'SHELL', 'TERM', 'TMPDIR', 'USER']) {
    if (ambient[key] !== undefined) environment[key] = ambient[key];
  }
  for (const key of command.passthroughVariables) {
    if (ambient[key] !== undefined) environment[key] = ambient[key];
  }

  const missing = [];
  const unresolved = [];
  for (const variable of profile.requiredVariables) {
    const value = ambient[variable];
    if (typeof value !== 'string' || value.length === 0) {
      missing.push(variable);
    } else if (UNRESOLVED_REFERENCE_RE.test(value)) {
      unresolved.push(variable);
    } else {
      environment[variable] = value;
    }
  }
  if (missing.length > 0) throw new ProfileError('REQUIRED_VALUE_MISSING', missing);
  if (unresolved.length > 0) throw new ProfileError('REFERENCE_UNRESOLVED', unresolved);
  return {
    environment,
    secretValues: profile.requiredVariables.map((name) => environment[name]),
  };
}

export function createRedactedForwarder(stream, values) {
  const secrets = [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]
    .sort((left, right) => right.length - left.length);
  let buffer = '';
  const flush = (final) => {
    while (buffer.length > 0) {
      const complete = secrets.find((secret) => buffer.startsWith(secret));
      if (complete) {
        stream.write('[REDACTED]');
        buffer = buffer.slice(complete.length);
        continue;
      }
      if (!final && secrets.some((secret) => secret.startsWith(buffer))) return;
      stream.write(buffer[0]);
      buffer = buffer.slice(1);
    }
  };
  return {
    write(chunk) {
      buffer += String(chunk);
      flush(false);
    },
    end() {
      flush(true);
    },
  };
}

export function signalExitCode(signal) {
  return 128 + (SIGNAL_NUMBERS[signal] ?? 0);
}

export function superviseChild(child, options = {}) {
  const signalSource = options.signalSource ?? process;
  const timeoutSeconds = options.timeoutSeconds ?? 0;
  const setTimeoutImpl = options.setTimeoutImpl ?? setTimeout;
  const clearTimeoutImpl = options.clearTimeoutImpl ?? clearTimeout;
  const handlers = new Map();
  let timeout;
  let forceKill;
  let timedOut = false;
  let settled = false;

  return new Promise((resolvePromise) => {
    const cleanup = () => {
      if (timeout) clearTimeoutImpl(timeout);
      if (forceKill) clearTimeoutImpl(forceKill);
      for (const [signal, handler] of handlers) signalSource.off(signal, handler);
    };
    const settle = (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolvePromise(code);
    };
    for (const signal of ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGTERM']) {
      const handler = () => {
        try { child.kill(signal); } catch {}
      };
      handlers.set(signal, handler);
      signalSource.on(signal, handler);
    }
    if (timeoutSeconds > 0) {
      timeout = setTimeoutImpl(() => {
        timedOut = true;
        try { child.kill('SIGTERM'); } catch {}
        forceKill = setTimeoutImpl(() => {
          try { child.kill('SIGKILL'); } catch {}
        }, 5000);
      }, timeoutSeconds * 1000);
    }
    child.once('error', () => settle(1));
    child.once('exit', (code, signal) => {
      if (timedOut) settle(124);
      else if (Number.isInteger(code)) settle(code);
      else settle(signalExitCode(signal));
    });
  });
}

function attachRedaction(child, secretValues) {
  const forwarder = createRedactedForwarder(process.stdout, secretValues);
  const streams = [child.stdout, child.stderr].filter(Boolean);
  let pending = streams.length;
  if (pending === 0) {
    forwarder.end();
    return;
  }
  for (const stream of streams) {
    stream.on('data', (chunk) => forwarder.write(chunk));
    stream.once('end', () => {
      pending -= 1;
      if (pending === 0) forwarder.end();
    });
  }
}

function spawnBoundTarget(context, commandName, options = {}) {
  const { command, profile, profileName } = selectBinding(context.manifest, commandName);
  if (!options.preflight && command.execution === 'preflight-only') {
    throw new ProfileError('PREFLIGHT_ONLY', [commandName]);
  }
  if (TYPE_SAFE_COMMANDS.has(commandName)) {
    (options.verifyTypeSafeSmokeRuntimeImpl ?? verifyTypeSafeSmokeRuntime)(
      context,
      options.environment ?? process.env,
      options,
    );
  }
  const { environment, secretValues } = buildTargetEnvironment(
    options.environment ?? process.env,
    context.root,
    profile,
    command,
  );
  if (options.preflight) {
    process.stdout.write(`Infisical profile ready: ${profileName} (${profile.requiredVariables.length} variables)\n`);
    return Promise.resolve(0);
  }
  const child = (options.spawnImpl ?? spawn)(command.executable, command.arguments, {
    cwd: context.root,
    env: environment,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  attachRedaction(child, secretValues);
  return superviseChild(child, {
    timeoutSeconds: command.timeoutSeconds,
    signalSource: options.signalSource,
    setTimeoutImpl: options.setTimeoutImpl,
    clearTimeoutImpl: options.clearTimeoutImpl,
  });
}

export async function checkHealth(fetchImpl = fetch, now = Date.now) {
  let response;
  try {
    response = await fetchImpl(`${INFISICAL_API_URL}/status`, {
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache, no-store, max-age=0',
        pragma: 'no-cache',
      },
    });
  } catch {
    throw new ProfileError('HEALTH_UNREACHABLE');
  }
  if (!response.ok) throw new ProfileError('HEALTH_FAILED');
  const cacheEvidence = ['age', 'x-cache', 'cf-cache-status']
    .some((header) => {
      const value = response.headers?.get?.(header);
      return value && !/^(?:0|DYNAMIC|MISS)$/i.test(value);
    });
  if (cacheEvidence) throw new ProfileError('HEALTH_CACHED');
  const body = await response.json();
  const timestamp = Date.parse(body.date);
  if (body.message !== 'Ok' || !Number.isFinite(timestamp)) {
    throw new ProfileError('HEALTH_SCHEMA');
  }
  if (Math.abs(now() - timestamp) > 300_000) throw new ProfileError('HEALTH_STALE');
  return true;
}

export async function runBinding(commandName, options = {}) {
  const context = options.context ?? loadContext(options.root);
  const { command, profile } = selectBinding(context.manifest, commandName);
  if (!options.preflight && command.execution === 'preflight-only') {
    throw new ProfileError('PREFLIGHT_ONLY', [commandName]);
  }
  if (TYPE_SAFE_COMMANDS.has(commandName)) {
    (options.verifyTypeSafeSmokeRuntimeImpl ?? verifyTypeSafeSmokeRuntime)(
      context,
      options.environment ?? process.env,
      options,
    );
  } else {
    (options.verifyRuntimeFilesImpl ?? verifyRuntimeFiles)(
      context,
      options.environment ?? process.env,
    );
  }
  const versionOutput = (options.execFileSyncImpl ?? execFileSync)('infisical', ['--version'], {
    cwd: context.root,
    env: buildInjectionEnvironment(options.environment ?? process.env, context.root, command),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  validateCliVersion(versionOutput, context.manifest.cliVersion);
  await checkHealth(options.fetchImpl, options.now);
  const mode = options.preflight ? '__preflight' : '__target';
  const child = (options.spawnImpl ?? spawn)(
    'infisical',
    buildInfisicalArguments(
      context.root,
      context.manifest,
      profile,
      commandName,
      options.runnerPath,
      mode,
    ),
    {
      cwd: context.root,
      env: buildInjectionEnvironment(options.environment ?? process.env, context.root, command),
      stdio: ['inherit', 'pipe', 'pipe'],
    },
  );
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
  return superviseChild(child, {
    timeoutSeconds: command.timeoutSeconds === 0 ? 0 : command.timeoutSeconds + 30,
    signalSource: options.signalSource,
    setTimeoutImpl: options.setTimeoutImpl,
    clearTimeoutImpl: options.clearTimeoutImpl,
  });
}

export async function runCli(args = process.argv.slice(2), options = {}) {
  const [operation, commandName, ...extra] = args;
  if (operation === 'check' && commandName === undefined) {
    const context = options.context ?? loadContext(options.root);
    process.stdout.write(
      `Infisical profile contract valid: ${context.manifest.repository.id} (${Object.keys(context.manifest.profiles).length} profiles)\n`,
    );
    return 0;
  }
  if ((operation === 'run' || operation === 'preflight') && commandName && extra.length === 0) {
    return runBinding(commandName, { ...options, preflight: operation === 'preflight' });
  }
  if ((operation === '__target' || operation === '__preflight') && commandName && extra.length === 0) {
    const context = options.context ?? loadContext(options.root);
    return spawnBoundTarget(context, commandName, {
      ...options,
      preflight: operation === '__preflight',
    });
  }
  throw new ProfileError('USAGE');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    const code = error instanceof ProfileError ? error.code : 'INTERNAL';
    const names = error instanceof ProfileError && error.names.length > 0
      ? ` [${error.names.join(',')}]`
      : '';
    process.stderr.write(`Infisical profile failed: ${code}${names}\n`);
    process.exitCode = 1;
  });
}
