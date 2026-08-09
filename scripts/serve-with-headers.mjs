// Minimal HTTP server with COOP/COEP headers for Playwright COOP/COEP tests.
// Serves the web/ directory on the given port.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.argv[2]) || 4173;
const BASE = process.argv[3] || "./web";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".wasm": "application/wasm",
  ".txt": "text/plain",
};

const server = http.createServer((req, res) => {
  let urlPath = req.url === "/" ? "/smoke.html" : req.url;
  let filePath = path.join(BASE, urlPath);

  // Security headers for cross-origin isolation
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

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
  console.log(`Serving ${BASE} on http://localhost:${PORT} with COOP/COEP`);
});
