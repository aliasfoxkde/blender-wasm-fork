#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

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

// Use `git remote -v` so it works in CI (actions/checkout may not preserve full .git/config)
try {
  const remotes = execSync('git remote -v', { encoding: 'utf8' });

  // upstream is required for local development (needed for `git fetch upstream`)
  // but may not exist in CI (actions/checkout only clones origin)
  const hasUpstream = remotes.includes('upstream');
  const upstreamPushDisabled = hasUpstream && remotes.includes('DISABLED_UPSTREAM_PUSH');
  if (!hasUpstream) {
    console.warn('WARN no upstream remote found — needed for `git fetch upstream`. Run: git remote add upstream https://github.com/HeyPuter/blender-wasm.git && git remote set-url --push upstream DISABLED_UPSTREAM_PUSH');
  } else if (!upstreamPushDisabled) {
    console.error('FAIL upstream push URL is not disabled. Run: git remote set-url --push upstream DISABLED_UPSTREAM_PUSH');
    failed = true;
  } else {
    console.log('OK upstream remote configured with push disabled');
  }

  const originOk = remotes.includes('origin') && remotes.includes('aliasfoxkde/blender-wasm-fork');
  if (!originOk) {
    console.error('FAIL origin remote must point to the user fork: https://github.com/aliasfoxkde/blender-wasm-fork.git');
    failed = true;
  } else {
    console.log('OK origin points to user fork');
  }
} catch {
  console.warn('WARN unable to run git remote -v for remote policy check');
}

if (failed) {
  process.exit(1);
}

console.log('Setup audit passed. No heavy build was run.');
