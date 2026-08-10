# R2 GitHub Secrets Setup

**Status**: Manual action required

The release workflow (`.github/workflows/release.yml`) requires 4 GitHub Secrets to upload artifacts to R2 on each release tag. These must be configured manually in the GitHub repository Settings.

---

## Required Secrets

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `R2_ACCOUNT_ID` | `ee03e28b74afa2be7d9792f248770393` | Cloudflare dashboard → Overview → Account ID |
| `R2_BUCKET` | `blender-wasm-assets` | Cloudflare dashboard → R2 → Manage buckets |
| `R2_ACCESS_KEY` | *(create new R2 token)* | Cloudflare dashboard → R2 → Manage R2 API tokens |
| `R2_SECRET_KEY` | *(create new R2 token)* | Cloudflare dashboard → R2 → Manage R2 API tokens |

---

## Steps to Create R2 API Token

1. Go to **Cloudflare Dashboard** → **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Choose **Edit** template (minimum permissions needed)
4. Under **Account**, select your account
5. Under **Bucket**, select `blender-wasm-assets` — do NOT select "All buckets"
6. Set an expiry (e.g., 1 year)
7. Copy the **Access Key ID** → use as `R2_ACCESS_KEY`
8. Copy the **Secret Access Key** → use as `R2_SECRET_KEY` (shown only once!)

---

## Adding Secrets to GitHub

1. Go to: `https://github.com/aliasfoxkde/blender-wasm-fork/settings/secrets/actions`
2. Click **New repository secret** for each secret above
3. Verify the release workflow runs successfully on the next tag push

---

## Verification

After adding secrets, push a test tag:

```bash
git tag v0.0.9-test && git push origin v0.0.9-test
```

Watch the release workflow at: `https://github.com/aliasfoxkde/blender-wasm-fork/actions`

Expected behavior:
- `release.yml` runs and uploads artifacts to R2
- No "R2_BUCKET not set — skipping R2 upload" message

---

## If Upload Fails

Check workflow logs for:
- `curl` or `wrangler` errors
- R2 API token expiration
- Bucket name mismatch
- Account ID mismatch

The `scripts/sync-assets.mjs` script uses `wrangler r2 object put --remote` to upload.
