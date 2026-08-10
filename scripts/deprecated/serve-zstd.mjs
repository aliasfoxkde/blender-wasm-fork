#!/usr/bin/env node
/**
 * serve-zstd.mjs
 *
 * Minimal HTTP server that transparently decompresses .zst files on the fly.
 * Uses the system `zstd` binary (spawned as a child process) for decompression.
 * Falls back to normal file serving for non-.zst files.
 *
 * COOP/COEP headers are set for cross-origin isolation.
 *
 * Usage:
 *   node scripts/serve-zstd.mjs [PORT] [BASE_DIR]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.argv[2]) || 8080;
const BASE = process.argv[3] || "./web";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
  ".zst": "application/octet-stream",
  ".png": "image/png",
  ".txt": "text/plain",
};

function spawnZstdDecomp(inputPath) {
  return spawn("zstd", ["--decompress", "--stdout", inputPath]);
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === "/" ? "/smoke.html" : req.url;
  const filePath = path.join(BASE, urlPath);

  // COOP/COEP for cross-origin isolation
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // If requesting a .zst file, decompress via system zstd binary
  if (urlPath.endsWith(".zst")) {
    const rawPath = filePath.replace(/\.zst$/, "");
    const ext = path.extname(rawPath);
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("X-Zstd-Decompressed", "1");
    res.setHeader("X-Original-File", path.basename(filePath));

    try {
      const zstdProc = spawnZstdDecomp(filePath);
      res.writeHead(200);
      zstdProc.stdout.pipe(res);
      zstdProc.stderr.on("data", (d) => console.error("[zstd]", d.toString()));
      zstdProc.on("error", (err) => {
        console.error("[zstd] proc error:", err.message);
        if (!res.headersSent) { res.writeHead(500); res.end(); }
      });
    } catch (err) {
      res.writeHead(500);
      res.end("Zstd spawn failed: " + err.message);
    }
    return;
  }

  // Normal file serving
  try {
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500);
    res.end(err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Serving ${BASE} on http://localhost:${PORT} with zstd streaming decompression`);
});
