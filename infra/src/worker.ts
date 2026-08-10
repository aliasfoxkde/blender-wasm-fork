/**
 * Cloudflare Worker — serves WASM artifacts from R2 with COOP/COEP headers.
 *
 * Routing:
 *   GET /manifest.json          → R2: manifest.json
 *   GET /cycles.js             → R2: cycles.js
 *   GET /cycles.wasm.zst        → R2: cycles.wasm.zst
 *   GET /cycles.data           → R2: cycles.data
 *   GET /blender/<file>        → R2: blender/<file>
 *   GET /blender.js             → R2: blender/blender.js
 *   GET /blender.wasm           → R2: blender/blender.wasm
 *   GET /blender.data           → R2: blender/blender.data
 *   GET /                       → serve built app from R2 (index.html)
 *   GET /*                      → serve built app assets from R2
 *
 * COOP/COEP headers are set on all responses for cross-origin isolation.
 */

interface Env {
  ASSETS: R2Bucket;
  ASSET_BASE_URL: string;
}

// In-memory ETag cache to avoid repeated R2 HEAD requests
const etags = new Map<string, string>();

const COOP_COEP_HEADERS = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

const CORS_HEADER = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\//, "");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: { ...COOP_COEP_HEADERS, ...CORS_HEADER },
      });
    }

    // Root → serve index.html from R2
    if (!path || path === "index.html") {
      return serveFromR2(env, "app/index.html", "text/html");
    }

    // Static assets (JS, CSS, images from built app)
    if (path.startsWith("assets/") || path.startsWith("_next/")) {
      const ct = mimeType(path);
      return serveFromR2(env, `app/${path}`, ct);
    }

    // Artifact routes
    if (path === "manifest.json") {
      return serveFromR2(env, "manifest.json", "application/json");
    }

    if (path.startsWith("cycles.")) {
      return serveFromR2(env, path, mimeType(path));
    }

    if (path.startsWith("blender/") || path.startsWith("blender.")) {
      const r2Key = path.startsWith("blender/") ? path : `blender/${path.replace("blender.", "")}`;
      return serveFromR2(env, r2Key, mimeType(path));
    }

    // App routes — serve from R2 app/ prefix
    return serveFromR2(env, `app/${path}`, mimeType(path));
  },
};

async function serveFromR2(env: Env, key: string, contentType: string): Promise<Response> {
  const r2Object = await env.ASSETS.get(key);

  if (!r2Object) {
    return new Response(`Not found: ${key}`, {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
        ...COOP_COEP_HEADERS,
      },
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  // ETag support for conditional requests
  const storedETag = etags.get(key);
  if (storedETag) {
    headers["ETag"] = storedETag;
  }

  if (r2Object.httpMetadata?.contentType) {
    headers["Content-Type"] = r2Object.httpMetadata.contentType;
  }

  const body = r2Object.body;
  return new Response(body, { headers });
}

function mimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
  const types: Record<string, string> = {
    js: "text/javascript",
    mjs: "text/javascript",
    wasm: "application/wasm",
    data: "application/octet-stream",
    json: "application/json",
    html: "text/html",
    css: "text/css",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    zst: "application/zstd",
    ico: "image/x-icon",
  };
  return types[ext] ?? "application/octet-stream";
}
