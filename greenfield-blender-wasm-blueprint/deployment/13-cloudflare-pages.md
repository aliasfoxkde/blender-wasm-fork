# 13 Cloudflare Pages Deployment

## Why Cloudflare Pages

Cloudflare Pages is a good default for this project because it supports:

- GitHub integration;
- preview deployments per branch/PR;
- custom domains;
- static app hosting;
- response headers;
- easy public demo URL for GitHub;
- optional Workers/R2 integration later.

## Deployment Goals

1. Main branch deploys to production.
2. Pull requests create preview URLs.
3. Custom domain points to production.
4. GitHub repository `About` uses the production demo URL.
5. Required headers are configured for pthread WASM.

## Required Headers

For pthreads/SharedArrayBuffer:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

Cloudflare Pages `_headers` file:

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
```

If third-party assets break under COEP, host them yourself or ensure they send compatible resource policies.

## Build Settings

Cloudflare Pages:

```text
Framework preset: None or Vite
Build command: pnpm install --frozen-lockfile && pnpm build
Build output directory: dist
Node version: 22
```

Environment variables:

```text
VITE_RENDER_ARTIFACT_BASE_URL=https://<artifact-host>/render/
VITE_APP_ENV=production
```

## Artifact Hosting

Option A: artifacts in Pages output.

Pros:

- simple;
- same origin;
- headers easy.

Cons:

- large deployments;
- slower CI;
- not ideal for frequent artifact rebuilds.

Option B: Cloudflare R2.

Pros:

- better for large artifacts;
- versioned artifact paths;
- separate app deploy from artifact deploy.

Cons:

- more setup;
- signed/private URLs if needed;
- CORS/header config required.

Option C: GitHub Releases.

Pros:

- easy public artifact archive;
- ties artifact to commit/tag.

Cons:

- cross-origin isolation and CORS may be more annoying;
- less control over caching.

Recommended:

```text
Pages for app.
R2 for large runtime artifacts.
GitHub Releases for archived artifact bundles.
```

## Custom Domain

Steps:

1. Add custom domain in Cloudflare Pages.
2. Let Cloudflare create DNS record.
3. Verify HTTPS.
4. Add domain to GitHub repo `About` website field.
5. Add link in `README.md`.

Suggested URLs:

```text
https://blender-web.example.com
https://render.blender-web.example.com
```

## Preview Deployments

Use preview deployments for:

- UI changes;
- artifact manifest changes;
- docs review.

Do not run heavy Blender builds inside Pages build. Heavy builds should publish artifacts separately.

## Deployment Verification

Add a post-deploy smoke test:

```bash
BASE_URL=https://your-domain.example pnpm exec playwright test tests/e2e/deployed-smoke.spec.ts --project=chromium
```

Checks:

- app loads;
- required headers exist;
- manifest fetch works or cleanly reports missing artifact;
- no fake render success;
- PWA manifest loads.

## GitHub Demo Link

After production deploy:

1. Open GitHub repo settings or sidebar `About`.
2. Set website/demo URL to Cloudflare Pages production URL.
3. Add README badges/links:

   ```md
   [Live Demo](https://your-domain.example)
   [Latest Release](https://github.com/<owner>/<repo>/releases/latest)
   ```

