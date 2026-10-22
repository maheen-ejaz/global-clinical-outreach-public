#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ProfileError, gitEnvironment, loadRepositoryContext } from './infisical-profile-runner.mjs';

const PRIVATE_INCLUDE_RE = /(?:^|\/)(?:\.env(?:\.[^/]*)?|[^/]*(?:backup|recovery|snapshot)[^/]*|[^/]*(?:private[-_]?key|service[-_]?account)[^/]*|id_(?:rsa|dsa|ecdsa|ed25519)|[^/]+\.(?:p8|p12|pfx|pem|key))(?:$|\/)/i;

export function validateWorktreeInclude(text) {
  const rejected = [];
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (PRIVATE_INCLUDE_RE.test(`/${line.replace(/^\/+/, '')}`)) rejected.push(line);
  }
  if (rejected.length) throw new ProfileError('WORKTREE_INCLUDE_PRIVATE_PATH', rejected);
  return true;
}

function git(root, args, options = {}) {
  return spawnSync('/usr/bin/git', args, {
    cwd: root,
    encoding: 'utf8',
    env: gitEnvironment(process.env, root),
    stdio: options.capture ? ['ignore', 'pipe', 'ignore'] : 'inherit',
  });
}

function gitOutput(root, args) {
  try {
    return execFileSync('/usr/bin/git', args, {
      cwd: root,
      encoding: 'utf8',
      env: gitEnvironment(process.env, root),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    throw new ProfileError('CHECKOUT_GIT_FAILED');
  }
}

export function assertCleanStatus(status) {
  if (String(status).trim() !== '') throw new ProfileError('CHECKOUT_DIRTY');
  return true;
}

export function buildSetupEnvironment(ambient, root) {
  return {
    ...gitEnvironment(ambient, root),
    NPM_CONFIG_AUDIT: 'false',
    NPM_CONFIG_FUND: 'false',
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
  };
}

function validateIncludeFile(root) {
  const path = resolve(root, '.worktreeinclude');
  if (!existsSync(path)) return true;
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || realpathSync(path) !== path) {
    throw new ProfileError('WORKTREE_INCLUDE_UNSAFE');
  }
  validateWorktreeInclude(readFileSync(path, 'utf8'));
  const tracked = git(root, ['ls-files', '--error-unmatch', '.worktreeinclude'], { capture: true });
  if (tracked.status !== 0) throw new ProfileError('WORKTREE_INCLUDE_UNTRACKED');
  return true;
}

export function checkoutRelationship({ head, remote, headAncestor, remoteAncestor }) {
  if (head === remote) return 'current';
  if (remoteAncestor) return 'feature';
  if (headAncestor) return 'stale';
  return 'diverged';
}

function relationship(root, remoteRef) {
  const head = gitOutput(root, ['rev-parse', 'HEAD']);
  const remote = gitOutput(root, ['rev-parse', remoteRef]);
  const headAncestor = git(root, ['merge-base', '--is-ancestor', head, remote], { capture: true }).status === 0;
  const remoteAncestor = git(root, ['merge-base', '--is-ancestor', remote, head], { capture: true }).status === 0;
  return { head, remote, value: checkoutRelationship({ head, remote, headAncestor, remoteAncestor }) };
}

export function checkCheckout(context = loadRepositoryContext()) {
  const { root, manifest } = context;
  validateIncludeFile(root);
  const remoteRef = `refs/remotes/origin/${manifest.repository.defaultBranch}`;
  const state = relationship(root, remoteRef);
  if (state.value === 'stale') throw new ProfileError('CHECKOUT_STALE');
  if (state.value === 'diverged') throw new ProfileError('CHECKOUT_DIVERGED');
  return state.value;
}

export function setupWorktree(context = loadRepositoryContext()) {
  const { root, manifest } = context;
  validateIncludeFile(root);
  const branch = manifest.repository.defaultBranch;
  const remoteRef = `refs/remotes/origin/${branch}`;
  const fetchResult = git(root, [
    'fetch', '--no-tags', 'origin', `refs/heads/${branch}:${remoteRef}`,
  ]);
  if (fetchResult.status !== 0) throw new ProfileError('CHECKOUT_FETCH_FAILED', [branch]);
  const state = relationship(root, remoteRef);
  if (state.value === 'diverged' || state.value === 'feature') {
    throw new ProfileError('CHECKOUT_NOT_ANCESTOR', [branch]);
  }
  assertCleanStatus(gitOutput(root, ['status', '--porcelain']));
  if (state.value === 'stale') {
    const symbolic = git(root, ['symbolic-ref', '-q', 'HEAD'], { capture: true });
    if (symbolic.status === 0) throw new ProfileError('CHECKOUT_ATTACHED_STALE');
    const merge = git(root, ['merge', '--ff-only', remoteRef]);
    if (merge.status !== 0) throw new ProfileError('CHECKOUT_FAST_FORWARD_FAILED');
  }
  const install = spawnSync('npm', ['ci'], {
    cwd: root,
    stdio: 'inherit',
    env: buildSetupEnvironment(process.env, root),
  });
  if (install.status !== 0) throw new ProfileError('DEPENDENCY_INSTALL_FAILED');
  assertCleanStatus(gitOutput(root, ['status', '--porcelain']));
  loadRepositoryContext({ cwd: root });
  return checkCheckout({ root, manifest });
}

export function runCli(args = process.argv.slice(2)) {
  if (args.length !== 1 || !['check', 'setup'].includes(args[0])) throw new ProfileError('USAGE');
  const state = args[0] === 'setup' ? setupWorktree() : checkCheckout();
  console.log(`Codex checkout passed: ${state}`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = runCli();
  } catch (error) {
    console.error(`Codex checkout failed: ${error.code ?? 'INTERNAL'}`);
    process.exitCode = 1;
  }
}
