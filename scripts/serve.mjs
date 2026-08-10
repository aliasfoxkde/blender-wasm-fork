// Tiny static file server that sets the cross-origin isolation headers
// (COOP/COEP) WASM pthreads + SharedArrayBuffer require. Used by both the
// dev workflow and the Playwright verifier.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.argv[2] || process.cwd();
const PORT = Number(process.argv[3] || 8080);

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const urlPath = decodeURIComponent(url.pathname);

    // Streaming zstd decompression — intercepts .zst requests
    if (urlPath.endsWith(".zst")) {
      const rawPath = urlPath.replace(/\.zst$/, "");
      const mimeMap = {
        ".wasm": "application/wasm",
        ".data": "application/octet-stream",
      };
      const ext = rawPath.substring(rawPath.lastIndexOf("."));
      const mime = mimeMap[ext] || "application/octet-stream";
      const p = normalize(join(ROOT, rawPath));

      res.writeHead(200, {
        "Content-Type": mime,
        "X-Zstd-Decompressed": "1",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Cache-Control": "no-store",
      });

      const zstd = spawn("zstd", ["--decompress", "--stdout", p]);
      zstd.stdout.pipe(res);
      zstd.on("error", () => res.end());
      return;
    }

    let p = normalize(join(ROOT, urlPath));
    if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    let s = await stat(p).catch(() => null);
    if (s && s.isDirectory()) { p = join(p, "index.html"); s = await stat(p).catch(() => null); }
    if (!s) { res.writeHead(404).end("not found: " + url.pathname); return; }
    const body = await readFile(p);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(p)] || "application/octet-stream",
      // pthreads / SharedArrayBuffer require cross-origin isolation:
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

server.listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
