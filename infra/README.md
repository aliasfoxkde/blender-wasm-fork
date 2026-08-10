# Infrastructure

## Cloudflare R2 + Worker (Deployed)

Worker URL: `https://blender-wasm-assets.cyopsys.workers.dev/`

R2 stores the large WASM artifacts (blender.wasm ~137 MB, blender.data ~56 MB) that exceed GitHub's file size limits. The Worker serves them with COOP/COEP headers so cross-origin isolation works in the browser.

### Verified Routes (all return 200)

| Request | R2 Key | Content-Type |
|---------|---------|--------------|
| `/` | `app/index.html` | `text/html` |
| `/smoke.html` | `smoke.html` | `text/html` |
| `/render.html` | `render.html` | `text/html` |
| `/cycles.js` | `cycles.js` | `application/javascript` |
| `/cycles.wasm.zst` | `cycles.wasm.zst` | `application/zstd` |
| `/cycles.data` | `cycles.data` | `application/octet-stream` |
| `/blender.js` | `blender.js` | `application/javascript` |
| `/blender.wasm` | `blender.wasm` | `application/wasm` |
| `/blender.data` | `blender.data` | `application/octet-stream` |
| `/assets/*.js` | `app/assets/*.js` | `application/javascript` |
| `/assets/*.css` | `app/assets/*.css` | `text/css` |

All responses include:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cache-Control: public, max-age=31536000, immutable`

### Cloudflare Pages (Deployed)

Pages URL: `https://595e1afb.blender-wasm.pages.dev/`

For custom domain setup:
1. Go to Cloudflare Dashboard → Pages → blender-wasm → Settings → Custom Domains
2. Add your domain (e.g., `blender.yourdomain.com`)
3. Create a CNAME record in DNS pointing to `blender-wasm.pages.dev`

### One-Time Setup (New Bucket)

```bash
# 1. Install and authenticate wrangler
npm i -g wrangler
wrangler login

# 2. Create R2 bucket
wrangler r2 bucket create blender-wasm-assets

# 3. Get credentials for GitHub Actions
# Cloudflare Dashboard → R2 → Manage R2 Tokens → Create API Token
# Permissions: Object Read + Write

# 4. Upload artifacts
export R2_ACCOUNT_ID=your_account_id
export R2_ACCESS_KEY=your_access_key_id
export R2_SECRET_KEY=your_secret_key
export R2_BUCKET=blender-wasm-assets
node scripts/sync-assets.mjs

# 5. Deploy Worker
cd infra && wrangler deploy
```

### GitHub Actions Secrets

Add these to **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `R2_ACCOUNT_ID` | From Cloudflare API token |
| `R2_ACCESS_KEY` | From R2 API token |
| `R2_SECRET_KEY` | From R2 API token |
| `R2_BUCKET` | `blender-wasm-assets` |

### Release Workflow

The `release.yml` workflow:
1. Checks out code
2. Builds cycles artifacts (if not already present)
3. Uploads to R2 (if `R2_BUCKET` secret configured)
4. Creates GitHub release with auto-generated notes

The `build-and-release.yml` workflow requires the full emscripten toolchain (44 GB, hours to build) and is meant for the builder machine, not standard CI.
