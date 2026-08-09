#!/usr/bin/env node
/**
 * audit-artifacts.mjs
 *
 * Audits the demo render artifacts without building anything.
 *
 * Targets:
 *   demo/public/blender.js
 *   demo/public/blender.wasm.zst
 *   demo/public/assets.tar.zst
 *   demo/public/manifest.json
 *   demo/public/wgsl-cache.json
 *
 * Rules:
 *   - If no artifacts are present, print SKIP and exit 0.
 *   - If manifest exists but required files are missing, exit 1.
 *   - If manifest exists, validate JSON.
 *   - Print sizes for all present files.
 *   - Never build anything.
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const PUBLIC_DIR = resolve('demo/public');
const TARGETS = [
  'blender.js',
  'blender.wasm.zst',
  'assets.tar.zst',
  'manifest.json',
  'wgsl-cache.json',
];

function fileSize(path) {
  try {
    const stat = statSync(path);
    return stat.size;
  } catch {
    return null;
  }
}

function formatSize(bytes) {
  if (bytes === null) return 'missing';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    return null;
  }
}

function audit() {
  const present = TARGETS.filter(t => existsSync(join(PUBLIC_DIR, t)));
  const manifestPresent = present.includes('manifest.json');

  // Check required files if manifest exists
  if (manifestPresent) {
    const manifest = readJson(join(PUBLIC_DIR, 'manifest.json'));
    if (!manifest) {
      console.error('FAIL: manifest.json is not valid JSON');
      process.exit(1);
    }

    const requiredKeys = ['artifacts', 'version'];
    for (const key of requiredKeys) {
      if (!(key in manifest)) {
        console.error(`FAIL: manifest.json missing required key "${key}"`);
        process.exit(1);
      }
    }

    const artifactEntries = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
    for (const entry of artifactEntries) {
      if (!entry.file) {
        console.error('FAIL: manifest entry missing "file" field');
        process.exit(1);
      }
      const fullPath = join(PUBLIC_DIR, entry.file);
      if (!existsSync(fullPath)) {
        console.error(`FAIL: manifest references "${entry.file}" but file is missing`);
        process.exit(1);
      }
    }

    console.log('OK manifest.json is valid JSON with required keys');
  }

  // Report present files and sizes
  if (present.length === 0) {
    console.log('SKIP: no render artifacts present');
    console.log('      Run "make mvp" on a builder to produce artifacts.');
    process.exit(0);
  }

  console.log('Artifact audit:');
  for (const target of TARGETS) {
    const path = join(PUBLIC_DIR, target);
    const size = fileSize(path);
    const status = size !== null ? 'OK' : 'MISSING';
    console.log(`  ${status.padEnd(8)} ${target.padEnd(25)} ${formatSize(size)}`);
  }

  if (manifestPresent) {
    const manifest = readJson(join(PUBLIC_DIR, 'manifest.json'));
    if (manifest && Array.isArray(manifest.artifacts)) {
      console.log('\nManifest artifact entries:');
      for (const entry of manifest.artifacts) {
        const path = join(PUBLIC_DIR, entry.file);
        const size = fileSize(path);
        console.log(`  ${entry.file.padEnd(25)} ${formatSize(size)}`);
      }
    }
  }

  console.log('\nPASS: artifact audit complete');
}

audit();
