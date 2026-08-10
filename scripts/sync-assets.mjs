#!/usr/bin/env node
/**
 * sync-assets.mjs
 *
 * Uploads WASM artifacts to Cloudflare R2 using the Wrangler CLI.
 * Wrangler handles auth and the S3-compatible protocol — no manual signing.
 *
 * Usage:
 *   node scripts/sync-assets.mjs [--dry] [--env production]
 *
 * Prerequisites:
 *   npm i -g wrangler
 *   wrangler login   (one-time: authenticate with Cloudflare)
 *
 * Environment (optional — wrangler uses its own auth after login):
 *   R2_BUCKET  — R2 bucket name (default: blender-wasm-assets)
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [, , ...args] = process.argv;
const isDry = args.includes("--dry");
const env = args.includes("--env") ? "production" : "staging";

const bucket = process.env.R2_BUCKET ?? "blender-wasm-assets";

// Files to upload — skip non-existent files so builder-missing files don't fail
const ARTIFACTS = [
  { key: "cycles.js",            file: "web/cycles.js" },
  { key: "cycles.wasm",           file: "web/cycles.wasm" },
  { key: "cycles.wasm.zst",      file: "web/cycles.wasm.zst" },
  { key: "cycles.data",          file: "web/cycles.data" },
  { key: "blender/blender.js",   file: "web/blender.js" },
  { key: "blender/blender.wasm",  file: "web/blender.wasm" },
  { key: "blender/blender.data", file: "web/blender.data" },
  { key: "manifest.json",        file: "demo/public/manifest.json" },
];

function run(cmd, filePath, key) {
  if (isDry) {
    const size = existsSync(filePath) ? formatSize(fileSize(filePath)) : "N/A";
    console.log(`  [dry] wrangler r2 object put ${bucket}/${key} ${filePath} (${size})`);
    return { ok: true };
  }

  const fullCmd = `${cmd} r2 object put ${bucket}/${key} --file ${filePath}`;
  console.log(`  wrangler r2 object put ${bucket}/${key}`);

  const result = spawnSync("wrangler", ["r2", "object", "put", `${bucket}/${key}`, "--file", filePath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status === 0) return { ok: true };
  return { ok: false, stderr: result.stderr };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileSize(path) {
  try {
    const { size } = require("fs").statSync(path);
    return size;
  } catch { return 0; }
}

async function main() {
  console.log(`\nSync artifacts to R2 bucket: ${bucket}`);
  console.log(`Mode: ${isDry ? "DRY RUN" : "LIVE"}\n`);

  // Check wrangler is available
  const wranglerCheck = spawnSync("wrangler", ["--version"], { encoding: "utf8" });
  if (wranglerCheck.status !== 0) {
    console.error("Error: wrangler not found. Install with: npm i -g wrangler");
    process.exit(1);
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const artifact of ARTIFACTS) {
    const filePath = resolve(process.cwd(), artifact.file);

    if (!existsSync(filePath)) {
      console.warn(`  - ${artifact.key} (not found — skip)`);
      skipped++;
      continue;
    }

    const result = run("wrangler", filePath, artifact.key);
    if (result.ok) {
      const size = fileSize(filePath);
      console.log(`    ✓ ${artifact.key} (${formatSize(size)})`);
      uploaded++;
    } else {
      console.error(`    ✗ ${artifact.key} — ${result.stderr ?? "failed"}`);
      failed++;
    }
  }

  console.log(`\nSync complete: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
