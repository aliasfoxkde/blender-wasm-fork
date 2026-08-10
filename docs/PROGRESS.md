# Project Progress — 2026-08-10

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 1 | CI and Artifact Audit | ✅ Complete |
| 2 | Honest Unavailable State | ✅ Complete |
| 3 | Cloudflare Pages Deployment | ✅ Complete |
| 4 | Heavy Build Readiness | ✅ Complete |
| 5 | Cycles MVP Build | ✅ Complete |
| 6 | React App Scaffold and Runtime | ✅ Complete |
| 7 | Pixel Verification Harness | ✅ Complete |
| 8 | Artifact Optimization (zstd) | ✅ Complete |
| 9 | Full Blender WASM | ✅ Complete |
| 10 | R2 Artifact Hosting | ✅ Complete |
| 11 | App Sync-on-Load (Phase 14) | ✅ Complete |
| 12 | Persistence (Track G) | ✅ Complete |
| 13 | Auth/Sync Guest Mode (Track H) | ✅ Complete |

---

## Phase 10: R2 Artifact Hosting

**Status**: ✅ Complete

**Key achievements**:
- R2 bucket `blender-wasm-assets` created
- Worker deployed at `https://blender-wasm-assets.cyopsys.workers.dev`
- All routes verified 200: `cycles.js`, `cycles.wasm`, `cycles.wasm.zst`, `blender.js`, `blender.wasm`, `blender.data`, `manifest.json`, `render.html`, `smoke.html`
- `ASSET_BASE_URL` corrected to actual Worker domain

**Artifacts**: `infra/worker.ts`, `infra/wrangler.toml`, `scripts/sync-assets.mjs`

---

## Phase 11: App Sync-on-Load (Phase 14)

**Status**: ✅ Complete

**Key achievements**:
- `StorageStatus` component: WASM cache count + clear button
- `RenderHistoryList` component: saved renders with delete
- `CyclesRenderRuntime.checkR2Version()`: fetches R2 manifest and displays version during load
- Both components wired to `RenderProofPage`

**Artifacts**: `app/src/components/StorageStatus.tsx`, `app/src/components/RenderHistoryList.tsx`, `app/src/runtime/CyclesRenderRuntime.ts`

---

## Phase 12: Persistence (Track G)

**Status**: ✅ Complete

**Key achievements**:
- `WasmCache.ts`: IndexedDB cache for decompressed WASM bytes (getCachedWasm, setCachedWasm, clearWasmCache, getCacheSize)
- `renderHistory.ts`: IndexedDB-backed render history (saveRenderRecord, getRenderRecords, getRenderRecord, deleteRenderRecord, clearAllRenderRecords)
- All functions tested with vi.mock in jsdom
- Storage cleanup UI: `StorageStatus` + `RenderHistoryList` in `RenderProofPage`

**Artifacts**: `app/src/runtime/WasmCache.ts`, `app/src/storage/renderHistory.ts`, `app/src/storage/renderHistory.test.ts`

---

## Phase 13: Auth/Sync Guest Mode (Track H)

**Status**: ✅ Complete (guest mode)

**Key achievements**:
- Guest mode works — no auth required for rendering
- `docs/decisions/auth-provider.md`: Supabase anonymous auth recommended
- Sync queue deferred pending Supabase project setup

**Artifacts**: `docs/decisions/auth-provider.md`

---

## CI/CD Validation

**All 107 tests passing**
- `pnpm audit:setup`: passed
- `pnpm audit:artifacts`: passed (cycles.js 199KB, cycles.wasm 16MB)
- Shell script syntax (`bash -n`): all scripts passed
- TypeScript typecheck: no errors
- Build: successful

**GitHub CI**: All runs confirmed SUCCESS via `gh run list`

**Deployment**:
- Cloudflare Pages: `https://cd8ccf45.blender-wasm.pages.dev` + `https://blender-wasm.pages.dev`
- Worker+R2: `https://blender-wasm-assets.cyopsys.workers.dev`
- GitHub Release: v0.0.9

---

## Known Limitations

1. **`cycles.data` is placeholder (12 B)**: No real `.blend` scene data embedded
2. **No WebGPU/EEVEE rendering**: GPU backend not enabled
3. **R2 GitHub secrets unconfigured**: `release.yml` can't upload to R2 automatically
4. **Custom domain DNS unconfigured**: `blender-wasm.cyopsys.com` not pointed to Pages
5. **build-release.yml cancelled**: Requires builder machine (44 GB disk, 31 GB RAM, 16 cores)
6. **Track H sync queue deferred**: Pending Supabase project setup
7. **No service worker (PWA offline)**: manifest added but no SW for offline caching
8. **`renderSampleScene()` needs real scene data**: Uses `/scenes/scene.blend` — scene.blend exists (121KB) but artifact loading path needs validation

---

## Task List

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| 1 | Embed real `.blend` in `cycles.data` | P0 | TODO | No real render output without this |
| 2 | Wire `renderSampleScene()` to Cycles | P0 | TODO | Skeleton exists, needs real artifact loading |
| 3 | Add E2E smoke test to CI | P1 | ✅ DONE | 10 tests now in CI, all passing |
| 4 | Configure R2 GitHub secrets | P1 | TODO | Manual — `docs/R2-SECRETS-SETUP.md` |
| 5 | Set up self-hosted runner for build | P1 | TODO | Manual — `docs/BUILDER-SETUP.md` |
| 6 | Configure custom domain DNS | P2 | TODO | Manual — Cloudflare dashboard |
| 7 | Add PWA manifest | P2 | ✅ DONE | manifest.json + favicon.svg added |
| 8 | Implement Supabase anonymous auth | P2 | TODO | After Supabase project creation |
| 9 | Add error boundary + crash recovery | P2 | ✅ DONE | ErrorBoundary in main.tsx |
| 10 | Add service worker for offline PWA | P2 | TODO | Missing SW for full PWA installability |
| 11 | Enable WebGPU backend | P3 | TODO | Requires `WITH_GPU=ON` in build |

---

## E2E Test Status

| Test File | Status | Notes |
|-----------|--------|-------|
| `app-smoke.spec.ts` | ✅ Pass (10 tests) | Now in CI, covers HomePage + RenderProofPage + PWA |
| `deployed-smoke.spec.ts` | ⚠️ Manual | Requires `BASE_URL` env var |
| `blender.spec.ts` | ⚠️ Partial | Headless timeout (143 MB WASM) |
| `render.spec.ts` | ⚠️ Partial | Depends on real Cycles artifact |
| `smoke-wasm.spec.ts` | ✅ Pass | Confirms WASM scaffolding |
