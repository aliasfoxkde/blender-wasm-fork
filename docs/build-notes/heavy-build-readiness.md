# Heavy Build Readiness

Date: 2026-08-09
Status: **COMPLETE** — builder machine used successfully

## What Was Built

### `make mvp` → Cycles Standalone (COMPLETED 2026-08-09)

`make cycles-web` produces:

```text
web/cycles.js        ~200 KB   (Cycles JS loader)
web/cycles.wasm      ~16.3 MB (Cycles WASM binary)
web/cycles.data      ~12 B    (placeholder — no scene data yet)
demo/public/cycles.js
demo/public/cycles.wasm
demo/public/cycles.data
demo/public/manifest.json
```

Artifact audit: **PASS** (see `pnpm audit:artifacts`)

### `make blender-web` → Full Blender WASM (COMPLETED 2026-08-09)

Requires: 44GB disk free, 31GB RAM, 16 cores (~2hr build time)

```text
web/blender.js        ~749 KB  (Blender JS loader)
web/blender.wasm     ~143 MB  (full Blender WASM — NOT committed to git)
web/blender.data      ~58 MB   (Blender data — NOT committed to git)
web/blender_assets/  (Python stdlib + Blender datafiles — committed)
```

**Note:** `blender.wasm` and `blender.data` exceed GitHub file size limits.
Build with `make blender-web` on a builder machine, serve from `web/`.

## Required Machine Resources

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 16 GB | 32 GB |
| Disk free | 50 GB | 100 GB |
| CPU cores | 8 | 16+ |
| Swap | 8 GB | 16 GB |
| OS | Linux (x86_64) | Linux (x86_64) |

## Build Commands

```bash
# Cycles standalone (MVP)
make toolchain
make cycles-web

# Full Blender (requires dep-python)
make dep-python          # build CPython 3.13 for WASM
make configure-blender
ninja -C build-blender bin/blender.js
bash scripts/link_blender_web.sh

# Full verification
pnpm audit:artifacts
pnpm --filter blender-wasm-app test
CI=true pnpm exec playwright test tests/e2e/
```

## Log Capture

```bash
mkdir -p artifacts/logs
time make cycles-web 2>&1 | tee artifacts/logs/cycles-web.log
time ninja -C build-blender bin/blender.js 2>&1 | tee artifacts/logs/blender-wasm.log
```

## Artifact Sizes

| File | Size | GitHub |
|------|------|--------|
| `demo/public/cycles.js` | 199 KB | ✅ committed |
| `demo/public/cycles.wasm` | 16.3 MB | ✅ committed |
| `demo/public/cycles.data` | 12 B | ✅ committed |
| `demo/public/manifest.json` | 759 B | ✅ committed |
| `web/blender.js` | 749 KB | ✅ committed |
| `web/blender_assets/` | 50 MB | ✅ committed |
| `web/blender.wasm` | 143 MB | ❌ too large |
| `web/blender.data` | 58 MB | ❌ too large |
| `web/cycles.wasm.zst` | 3.4 MB | untracked |

## Verification

```bash
# Artifact audit
pnpm audit:artifacts
# PASS

# Unit tests
pnpm --filter blender-wasm-app test
# 55/55 passing

# E2E tests
CI=true pnpm exec playwright test tests/e2e/smoke-wasm.spec.ts
# 3/3 passing

CI=true pnpm exec playwright test tests/e2e/render.spec.ts
# 5/5 passing
```

## Next Targets

1. **Render a real scene** — `cycles.data` is placeholder; embed a `.blend` scene file
2. **WebGPU/EEVEE** — `make verify-blender-webgpu` (needs real GPU or SwiftShader)
3. **zstd compression** — `web/cycles.wasm.zst` already exists; wire `serve-zstd.mjs`
