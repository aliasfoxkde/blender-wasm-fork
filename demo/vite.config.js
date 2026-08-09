import { defineConfig } from "vite";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

/* Blender-wasm needs SharedArrayBuffer (pthreads): cross-origin isolation on
 * both the dev server and the preview server. */
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

/** Streaming zstd decompression middleware (mirrors scripts/serve-zstd.mjs).
 *  Intercepts requests for .zst files, decompresses via system `zstd` binary,
 *  and streams the decompressed content with the correct Content-Type. */
function zstdDecompressMiddleware(req, res, next) {
  const urlPath = req.url || "";
  if (!urlPath.endsWith(".zst")) { next(); return; }

  // Strip .zst to get the raw file path and infer its MIME type
  const rawPath = urlPath.replace(/\.zst$/, "");
  const ext = path.extname(rawPath);
  const mimeMap = {
    ".wasm": "application/wasm",
    ".data": "application/octet-stream",
    ".html": "text/html",
    ".js": "application/javascript",
    ".png": "image/png",
    ".txt": "text/plain",
  };
  const contentType = mimeMap[ext] || "application/octet-stream";

  // Set isolation headers so SharedArrayBuffer keeps working
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Content-Type", contentType);
  res.setHeader("X-Zstd-Decompressed", "1");

  // Resolve the .zst file relative to the web/ artifact directory
  const zstPath = path.resolve("web", urlPath.replace(/^\//, ""));
  if (!fs.existsSync(zstPath)) {
    res.writeHead(404);
    res.end("Not found: " + urlPath);
    return;
  }

  const zstdProc = spawn("zstd", ["--decompress", "--stdout", zstPath]);
  res.writeHead(200);
  zstdProc.stdout.pipe(res);
  zstdProc.stderr.on("data", (d) => console.error("[zstd]", d.toString()));
  zstdProc.on("error", (err) => {
    console.error("[zstd] proc error:", err.message);
    if (!res.headersSent) { res.writeHead(500); res.end(); }
  });
}

export default defineConfig({
  /* Emit relative asset URLs (./assets/...) so the built site works when served
   * from any subpath, not just the domain root. The runtime fetches
   * (blender.wasm.zst, assets.tar.zst, manifest.json, blender.js) are already
   * document-relative in main.js, so they follow the page's location too. */
  base: "./",
  server: {
    headers: isolationHeaders,
    allowedHosts: true,
    middleware: zstdDecompressMiddleware,
  },
  preview: { headers: isolationHeaders },
  build: { target: "esnext" },
});
