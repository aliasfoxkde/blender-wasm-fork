# Blueprint Task Backlog

Tracks A-H from `blueprint/plans/21-agent-task-backlog.md`.

## Track A: Repo Bootstrap

**Status**: ✅ COMPLETE

| Task | Acceptance Criteria |
|------|---------------------|
| A1: Root files | `pnpm install` succeeds |
| A2: Blueprint copy | All blueprint links resolve |
| A3: App scaffold | `pnpm build` in app/ succeeds |

---

## Track B: Artifact System

**Status**: ✅ COMPLETE

| Task | Acceptance Criteria |
|------|---------------------|
| B1: Manifest types | `app/src/runtime/ArtifactManifest.ts` exists |
| B2: Manifest validator | Tests cover valid and invalid manifests |
| B3: Artifact audit script | `pnpm audit:artifacts` runs successfully |

---

## Track C: App UX

**Status**: ✅ COMPLETE

| Task | Acceptance Criteria |
|------|---------------------|
| C1: Render proof page | Missing-artifact state visible; no fake render output |
| C2: Runtime progress component | States render correctly in tests |
| C3: Diagnostics drawer | Browser capability fields shown |

---

## Track D: Runtime

**Status**: ✅ COMPLETE

| Task | Acceptance Criteria |
|------|---------------------|
| D1: Runtime state machine | Invalid state transitions rejected |
| D2: CyclesRenderRuntime skeleton | Loads manifest, reports missing artifact clearly, no fake render success |
| D3: Render result handling | Image Blob URL generated only from returned bytes |

---

## Track E: Build Harness

**Status**: ✅ COMPLETE

| Task | Acceptance Criteria |
|------|---------------------|
| E1: Toolchain setup | `bash -n blender-build/scripts/setup-toolchain.sh` passes |
| E2: Blender fetch | `bash -n blender-build/scripts/fetch-blender.sh` passes |
| E3: Cycles CMake cache | `cmake/cycles-wasm-cache.cmake` contains required cache flags |

---

## Track F: CI and Deployment

**Status**: ✅ COMPLETE

| Task | Acceptance Criteria |
|------|---------------------|
| F1: PR CI | `.github/workflows/ci.yml` exists, no heavy build commands in PR CI |
| F2: Cloudflare headers | `public/_headers` has required COOP/COEP headers |
| F3: Deploy smoke test | `BASE_URL=http://localhost:4173 pnpm exec playwright test tests/e2e/deployed-smoke.spec.ts` passes |

---

## Track G: Persistence

**Status**: ✅ COMPLETE

| Task | Acceptance Criteria |
|------|---------------------|
| G1: Local DB schema | ✅ `app/src/storage/renderHistory.ts` with IndexedDB schema |
| G2: Render history | ✅ `saveRenderRecord`, `getRenderRecords`, `deleteRenderRecord` with tests |
| G3: Storage cleanup UI | ✅ `StorageStatus` component for WASM cache; `RenderHistoryList` for render history; both wired to IndexedDB storage |

---

## Track H: Auth and Sync

**Status**: 🔄 IN PROGRESS — auth provider decision documented

**Note**: Depends on Phase 14 (sync-on-load) completing first.

| Task | Acceptance Criteria |
|------|---------------------|
| H1: Auth provider decision | ✅ `docs/decisions/auth-provider.md` exists — Supabase anonymous auth recommended |
| H2: Sign-in UI | Guest mode still works |
| H3: Sync queue | Offline queue tests pass |

**Note**: R2 secrets setup documented at `docs/R2-SECRETS-SETUP.md` — requires manual GitHub configuration.

---

## Known Limitations

- **`cycles.data` is placeholder**: No real `.blend` scene data embedded yet; `cycles.data` is 12 B
- **Blender headless hang**: E2E tests for `blender.html` timeout in headless Chromium (143 MB WASM load exceeds 30s)
- **`blender.wasm` / `blender.data` not committed**: 143 MB and 58 MB exceed GitHub file size limits
- **Heavy build requires builder machine**: 44 GB disk, 31 GB RAM, 16 cores, ~2 hr build time
- **Cloudflare Pages 522 loop**: Pages can't proxy to Worker on same zone; app served directly from Worker + R2 instead
- **No WebGPU/EEVEE rendering**: GPU backend not yet enabled
- **Zstd streaming wired**: `CyclesRenderRuntime.locateFile` prefers `.wasm.zst`, demo server decompresses on-the-fly
- **IndexedDB warm start wired**: `CyclesRenderRuntime` checks IndexedDB cache via `Module["wasmBinary"]` for fast warm starts. Cache size and clear methods exposed.

---

## Recommended Next Phases

### Phase 10: Real Scene Data
Embed a real `.blend` file in `cycles.data` for actual render output. Replace 12 B placeholder with a minimal scene.

### Phase 11: WebGPU/EEVEE Rendering
Enable `WITH_GPU=ON` and WebGPU backend for GPU-accelerated rendering in browser.

### Phase 12: Persistent WASM Cache
Cache decompressed Cycles WASM in IndexedDB for sub-second warm starts.

### Phase 13: Cloudflare R2 Artifact Hosting
**COMPLETE — verified at `https://blender-wasm-assets.cyopsys.workers.dev`**

- R2 bucket `blender-wasm-assets` created and populated with all artifact types
- `infra/worker.ts` routes: `/cycles.*`, `/blender.*`, `/render.html`, `/smoke.html` — all returning 200 with correct COOP/COEP headers
- `scripts/sync-assets.mjs` uploads via `wrangler r2 object put --remote`
- `ARTIFACT_BASE` env var in CyclesRenderRuntime lets app use R2 URL at build time
- `.env` / `.env.example` for local dev vs production configuration
- Latest release only (10 GB R2 free tier)
- App deployed at `https://blender-wasm-assets.cyopsys.workers.dev/` via Worker + R2 (Pages 522 loop workaround)
- Cloudflare Pages deployment deferred — Worker serves app from R2 instead

### Phase 14: App Sync-on-Load
**COMPLETE — wired into RenderProofPage app shell**

- `CyclesRenderRuntime.checkR2Version()` fetches R2 manifest and displays version during load
- `StorageStatus` component in RenderProofPage shows WASM cache count, storage quota, clear button
- `RenderHistoryList` component in RenderProofPage shows saved renders with delete buttons
- App deployed at both Cloudflare Pages and Worker+R2

### Phase 15: Persistence (Track G)
Implement local IndexedDB schema, render history, and storage cleanup UI.
