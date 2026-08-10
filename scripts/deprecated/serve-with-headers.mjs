// Minimal HTTP server with COOP/COEP headers for Playwright COOP/COEP tests.
// Serves the web/ directory on the given port.
// Also handles .zst streaming decompression (mirrors scripts/serve-zstd.mjs).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.argv[2]) || 4173;
const BASE = process.argv[3] || "./web";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".wasm": "application/wasm",
  ".txt": "text/plain",
  ".zst": "application/octet-stream",
};

function spawnZstdDecomp(inputPath) {
  return spawn("zstd", ["--decompress", "--stdout", inputPath]);
}

const server = http.createServer((req, res) => {
  let urlPath = req.url === "/" ? "/smoke.html" : req.url;
  let filePath = path.join(BASE, urlPath);

  // Security headers for cross-origin isolation
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
  } catch (e) {
    res.writeHead(500);
    res.end(e.message);
  }
});

server.listen(PORT, () => {
  console.log(`Serving ${BASE} on http://localhost:${PORT} with COOP/COEP + zstd streaming`);
});
