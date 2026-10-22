import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCleanStatus,
  buildSetupEnvironment,
  checkoutRelationship,
  validateWorktreeInclude,
} from './codex-worktree.mjs';

test('accepts an absent or public-only worktree include policy', () => {
  assert.equal(validateWorktreeInclude('node_modules\npublic/generated\n# comment\n'), true);
});

test('rejects environment files, backups, snapshots, and private keys', () => {
  for (const path of [
    '.env', '.env.local', 'config/recovery.json', 'backup/settings.json',
    'snapshot/data', 'AuthKey_ABC.p8', 'play-service-account.json', 'certs/private-key.pem',
  ]) assert.throws(() => validateWorktreeInclude(`${path}\n`), /WORKTREE_INCLUDE_PRIVATE_PATH/);
});

test('classifies current, feature, stale, and diverged checkouts', () => {
  assert.equal(checkoutRelationship({ head: 'a', remote: 'a', headAncestor: true, remoteAncestor: true }), 'current');
  assert.equal(checkoutRelationship({ head: 'b', remote: 'a', headAncestor: false, remoteAncestor: true }), 'feature');
  assert.equal(checkoutRelationship({ head: 'a', remote: 'b', headAncestor: true, remoteAncestor: false }), 'stale');
  assert.equal(checkoutRelationship({ head: 'a', remote: 'b', headAncestor: false, remoteAncestor: false }), 'diverged');
});

test('dependency installation receives no ambient credentials or Git process controls', () => {
  const environment = buildSetupEnvironment({
    HOME: '/home/test', PATH: '/hostile', INFISICAL_TOKEN: 'secret', PROVIDER_API_KEY: 'secret',
    GIT_DIR: '/other', GIT_CONFIG_COUNT: '1',
  }, '/repo');
  assert.equal(environment.INFISICAL_TOKEN, undefined);
  assert.equal(environment.PROVIDER_API_KEY, undefined);
  assert.equal(environment.GIT_DIR, undefined);
  assert.equal(environment.GIT_CONFIG_COUNT, undefined);
  assert.equal(environment.PATH.includes('/hostile'), false);
  assert.equal(environment.PWD, '/repo');
});

test('fails closed when dependency installation changes tracked state', () => {
  assert.equal(assertCleanStatus(''), true);
  assert.throws(() => assertCleanStatus(' M package-lock.json\n'), /CHECKOUT_DIRTY/);
});
