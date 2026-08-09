# Cloudflare Pages Deployment

This fork deploys the demo app to Cloudflare Pages.

## Required Headers

Blender WASM needs `SharedArrayBuffer` (pthreads), which requires cross-origin isolation.
These are configured via `demo/public/_headers` and copied into `dist/` at build time:

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
```

## Build Settings

| Field | Value |
|---|---|
| Root directory | `demo` |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Output directory | `dist` |
| Node version | `22` |
| Framework preset | None (or Vite) |

## Artifact Hosting

Render artifacts (`blender.wasm.zst`, `assets.tar.zst`, `manifest.json`, `blender.js`) are large
(~50–200 MB). Options:

1. **Included in Pages output** — simple, same-origin, but slows CI and Pages bandwidth.
2. **Cloudflare R2** — recommended for frequent rebuilds; serves via signed/private URLs.
3. **GitHub Releases** — ties artifact bundles to commits/tags; cross-origin may need CORS config.

For the initial MVP, include artifacts in the Pages deployment.
Graduate to R2 when artifact size or rebuild frequency becomes a problem.

## Deployment Verification

```bash
BASE_URL=https://your-preview-url.pages.dev pnpm exec playwright test tests/e2e/deployed-smoke.spec.ts
```

Smoke test checks:
- App loads without crash
- Required COOP/COEP headers present
- `manifest.json` fetch succeeds or reports missing-artifact cleanly
- No fake Blender render state

## Custom Domain

1. Add custom domain in Cloudflare Pages dashboard.
2. Cloudflare creates the DNS record automatically.
3. Verify HTTPS is active.
4. Update GitHub repo `About` section with the production URL.
5. Add `[Live Demo](https://your-domain)` link to `README.md`.

## Preview Deployments

Cloudflare Pages creates a preview URL for every push/PR automatically.
Use preview URLs for UI review, manifest changes, and docs.

Do NOT run `make mvp`, `make cycles-web`, or `make blender-web` inside the Pages build.
Heavy artifact builds must happen on a separate CI runner or self-hosted builder.

## Adding a Production URL

When the production URL is available, update `README.md`:

```md
[![Live Demo](https://img.shields.io/badge/demo-live-blue?style=flat-square)](https://blender.example.com)
```
