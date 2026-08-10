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
| G1: Local DB schema | ✅ `renderHistory.ts` IndexedDB schema with version 1 migration; `WasmCache.ts` schema |
| G2: Render history | ✅ `saveRenderRecord`, `getRenderRecords`, `getRenderRecord`, `deleteRenderRecord`, `clearAllRenderRecords` with tests |
| G3: Storage cleanup UI | ✅ `StorageStatus` component (WASM cache count/clear); `RenderHistoryList` component (render history with delete); both wired to IndexedDB |

**Note**: All 107 tests passing. IndexedDB schemas implemented and tested via mocks in jsdom.

---

## Track H: Auth and Sync

**Status**: 🔄 IN PROGRESS

**Note**: Track G complete. Proceeding with auth provider decision.

| Task | Acceptance Criteria |
|------|---------------------|
| H1: Auth provider decision | ✅ `docs/decisions/auth-provider.md` exists — Supabase anonymous auth recommended |
| H2: Sign-in UI | Guest mode works (no auth required for rendering) |
| H3: Sync queue | Pending implementation |

**Next**: Create Supabase project, add `VITE_SUPABASE_URL` env var, implement anonymous sign-in

---

## Known Limitations

- **`cycles.data` is placeholder**: No real `.blend` scene data embedded yet; `cycles.data` is 12 B
- **Heavy build requires builder machine**: 44 GB disk, 31 GB RAM, 16 cores, ~2 hr build time
- **No WebGPU/EEVEE rendering**: GPU backend not yet enabled
- **Zstd streaming**: `CyclesRenderRuntime.locateFile` prefers `.wasm.zst`, Worker serves zstd-compressed WASM
- **IndexedDB warm start wired**: `WasmCache.ts` caches decompressed WASM in IndexedDB; `CyclesRenderRuntime.getCacheSize()`/`clearCache()` exposed

---

## Recommended Next Phases

### Phase 10: Real Scene Data
Embed a real `.blend` file in `cycles.data` for actual render output. Replace 12 B placeholder with a minimal scene.

### Phase 11: WebGPU/EEVEE Rendering
Enable `WITH_GPU=ON` and WebGPU backend for GPU-accelerated rendering in browser.

### Phase 12: Persistent WASM Cache
Cache decompressed Cycles WASM in IndexedDB for sub-second warm starts.

### Phase 13: Production Artifact Delivery
Wire `serve-zstd.mjs` streaming into the app runtime. Add CDN deployment for `blender.wasm` / `blender.data`.

### Phase 14: Persistence (Track G)
Implement local IndexedDB schema, render history, and storage cleanup UI.
