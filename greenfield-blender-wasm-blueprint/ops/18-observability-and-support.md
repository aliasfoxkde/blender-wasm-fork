# 18 Observability And Support

## Observability Goal

When a user says "it does not work," the app should provide enough local diagnostics to identify whether the issue is:

- unsupported browser;
- missing headers;
- artifact download failure;
- corrupt artifact;
- WASM instantiate failure;
- out of memory;
- render timeout;
- filesystem/output failure;
- service worker cache issue.

## Runtime Diagnostic Panel

Add an advanced diagnostics panel with:

```text
App version
Artifact manifest version
Artifact source ref
Browser
OS
crossOriginIsolated
SharedArrayBuffer availability
WebAssembly availability
WebGPU availability
Storage quota
Storage usage
Service worker state
Runtime state
Last error code
Last render elapsed time
```

## Support Bundle

Add `Download diagnostics` button.

Bundle contents:

```text
diagnostics.json
runtime-log.txt
manifest.json
storage-estimate.json
browser-capabilities.json
```

Never include:

- auth tokens;
- private project file contents;
- private file names unless user opts in;
- cloud signed URLs.

## Structured Error Codes

Use stable error codes:

```text
E_BROWSER_UNSUPPORTED
E_HEADERS_MISSING
E_MANIFEST_MISSING
E_MANIFEST_INVALID
E_ARTIFACT_MISSING
E_ARTIFACT_HASH
E_DOWNLOAD_FAILED
E_DECOMPRESS_FAILED
E_WASM_INSTANTIATE
E_RUNTIME_INIT
E_RENDER_TIMEOUT
E_RENDER_FAILED
E_OUTPUT_MISSING
E_STORAGE_QUOTA
E_SERVICE_WORKER
E_AUTH_REQUIRED
E_SYNC_FAILED
```

Every error code needs:

- user message;
- developer details;
- recovery action.

## Metrics

Track locally first:

```text
app_shell_ms
manifest_fetch_ms
artifact_download_ms
artifact_decompress_ms
wasm_instantiate_ms
runtime_ready_ms
render_ms
output_bytes
memory_estimate
cache_hit
```

Do not add analytics until privacy policy exists.

## Crash Reporting

Future option:

- Sentry;
- self-hosted error endpoint;
- Cloudflare Workers log endpoint.

Rules:

- opt out must exist;
- no project files;
- no tokens;
- no large logs by default;
- sampling for noisy failures.

## User-Facing Troubleshooting

Create a troubleshooting page with sections:

### Browser Does Not Support Runtime

Explain:

- required browser;
- SharedArrayBuffer;
- cross-origin isolation;
- WebGPU later.

### Download Fails

Explain:

- network;
- artifact host;
- cache cleanup;
- retry.

### Render Fails

Explain:

- memory;
- timeout;
- unsupported device;
- artifact mismatch.

### Offline Mode

Explain:

- app shell may work;
- render works only if artifacts are cached;
- sync waits until online.

## Operational Runbooks

### Bad Artifact Published

1. Remove manifest from production path or roll back to prior manifest.
2. Clear CDN cache for manifest.
3. Keep old versioned artifact files available.
4. Add incident note.

### Cloudflare Headers Broken

1. Check `_headers`.
2. Redeploy.
3. Verify with:

   ```bash
   curl -I https://example.com
   ```

4. Run deployed smoke test.

### Storage Quota Complaints

1. Ask user to download diagnostics.
2. Check quota/usage.
3. Direct user to storage cleanup UI.
4. Consider smaller artifact profile.

