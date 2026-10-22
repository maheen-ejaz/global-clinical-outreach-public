#!/usr/bin/env node

export * from './infisical-profile-runner.mjs';

import { pathToFileURL } from 'node:url';
import { runCli } from './infisical-profile-runner.mjs';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(['check']).then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(`Infisical profile contract failed: ${error.code ?? 'INTERNAL'}`);
    process.exitCode = 1;
  });
}
