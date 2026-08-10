# Infrastructure

## Cloudflare R2 + Worker

R2 stores the large WASM artifacts (blender.wasm ~137 MB, blender.data ~56 MB) that exceed GitHub's file size limits. The Worker serves them with COOP/COEP headers so cross-origin isolation works in the browser.

### One-Time Setup

```bash
# 1. Install and authenticate wrangler
npm i -g wrangler
wrangler login

# 2. Create R2 bucket
wrangler r2 bucket create blender-wasm-assets

# 3. Get credentials for script/GitHub Actions
# Cloudflare Dashboard → R2 → Manage R2 Tokens → Create API Token
# Permissions: Object Read + Write

# 4. Set environment variables
export R2_ACCOUNT_ID=your_account_id
export R2_ACCESS_KEY=your_access_key_id
export R2_SECRET_KEY=your_secret_key
export R2_BUCKET=blender-wasm-assets

# 5. Upload current artifacts
node scripts/sync-assets.mjs

# 6. Deploy Worker
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

### Worker Routes

The Worker handles routing automatically:

| Request | R2 Key | Content-Type |
|---------|---------|--------------|
| `/cycles.js` | `cycles.js` | `application/javascript` |
| `/cycles.wasm.zst` | `cycles.wasm.zst` | `application/zstd` |
| `/cycles.data` | `cycles.data` | `application/octet-stream` |
| `/blender/blender.wasm` | `blender/blender.wasm` | `application/wasm` |
| `/blender/blender.data` | `blender/blender.data` | `application/octet-stream` |

All responses include:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cache-Control: public, max-age=31536000, immutable`
