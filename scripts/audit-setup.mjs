#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = [
  'README.md',
  'CLAUDE.md',
  'AGENTS.md',
  'Makefile',
  'blueprint/README.md',
  'docs/devops/workflow-policy.md',
  'docs/handoff/2026-08-08-claude-minimax-handoff.md',
  'docs/handoff/2026-08-08-audit.md',
  'demo/vite.config.js',
  'demo/public/_headers',
];

const requiredHeaderLines = [
  'Cross-Origin-Opener-Policy: same-origin',
  'Cross-Origin-Embedder-Policy: require-corp',
  'Cross-Origin-Resource-Policy: cross-origin',
];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`FAIL missing required file: ${file}`);
    failed = true;
  } else {
    console.log(`OK ${file}`);
  }
}

const headersPath = join('demo', 'public', '_headers');
if (existsSync(headersPath)) {
  const headers = readFileSync(headersPath, 'utf8');
  for (const line of requiredHeaderLines) {
    if (!headers.includes(line)) {
      console.error(`FAIL demo/public/_headers missing: ${line}`);
      failed = true;
    }
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!pkg.scripts?.['audit:setup']) {
  console.error('FAIL package.json missing scripts.audit:setup');
  failed = true;
} else {
  console.log('OK package.json scripts.audit:setup');
}

try {
  const gitConfig = readFileSync('.git/config', 'utf8');
  if (!gitConfig.includes('pushurl = DISABLED_UPSTREAM_PUSH')) {
    console.error('FAIL upstream origin push URL is not disabled. Run: git remote set-url --push origin DISABLED_UPSTREAM_PUSH');
    failed = true;
  } else {
    console.log('OK upstream origin push URL disabled');
  }
} catch {
  console.warn('WARN unable to inspect .git/config for upstream push URL');
}

if (failed) {
  process.exit(1);
}

console.log('Setup audit passed. No heavy build was run.');
