# Project Progress

Date: 2026-08-09

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

---

## Phase 1: CI and Artifact Audit

**Status**: ✅ Complete

**Key achievements**:
- Added fast PR workflow (`.github/workflows/ci.yml`) without heavy build commands
- Added artifact audit tool (`scripts/audit-artifacts.mjs`)
- Fork remote workflow normalized (`upstream` = HeyPuter, `origin` = user fork)

**Artifacts**: `scripts/audit-artifacts.mjs`, `.github/workflows/ci.yml`

---

## Phase 2: Honest Unavailable State

**Status**: ✅ Complete

**Key achievements**:
- Demo shows clear missing-artifact message when `manifest.json` is absent
- No fake Blender render output when artifacts are missing
- Existing HeyPuter loading behavior preserved when artifacts exist

**Artifacts**: `demo/src/main.js`, `demo/index.html`

---

## Phase 3: Cloudflare Pages Deployment

**Status**: ✅ Complete

**Key achievements**:
- Added Cloudflare Pages deployment guide (`docs/deployment/cloudflare-pages.md`)
- Added `demo/public/_headers` with COOP/COEP headers
- Documented build settings (root: `demo`, build: `pnpm install --frozen-lockfile && pnpm build`, output: `dist`, Node: 22)

**Artifacts**: `docs/deployment/cloudflare-pages.md`, `demo/public/_headers`

---

## Phase 4: Heavy Build Readiness

**Status**: ✅ Complete

**Key achievements**:
- Documented exact heavy build commands and resource requirements
- Added `docs/build-notes/heavy-build-readiness.md`
- Build note covers `make mvp` (Cycles) and `make blender-web` (full Blender) with log capture commands

**Artifacts**: `docs/build-notes/heavy-build-readiness.md`

---

## Phase 5: Cycles MVP Build

**Status**: ✅ Complete

**Key achievements**:
- Built Cycles standalone (`cycles.js` + `cycles.wasm`) via `make cycles-web`
- emsdk 6.0.1, Blender ref `6b031d3d41c392883e3c495aa72343e10d15b43d`
- Resolved Git LFS pointer checkout (pull from `projects.blender.org` upstream)
- Artifact audit passes

**Artifacts**:
| File | Size |
|------|------|
| demo/public/cycles.js | 199 KB |
| demo/public/cycles.wasm | 16.3 MB |
| demo/public/cycles.data | 12 B |
| demo/public/manifest.json | 759 B |

**Known limitation**: `cycles.data` is empty placeholder (12 B), no real scene data.

---

## Phase 6: React App Scaffold and Runtime

**Status**: ✅ Complete

**Key achievements**:
- Added React app scaffold (`app/`) with Vite and TypeScript
- Added `CyclesRenderRuntime` skeleton that loads real WASM artifacts
- Added `RuntimeProgress` component for load state display
- Added `DiagnosticsDrawer` showing browser capability fields
- Added `RenderProofPage` with missing-artifact state

**Artifacts**: `app/src/runtime/CyclesRenderRuntime.ts`, `app/src/components/RuntimeProgress.tsx`, `app/src/components/DiagnosticsDrawer.tsx`, `app/src/routes/RenderProofPage.tsx`

---

## Phase 7: Pixel Verification Harness

**Status**: ✅ Complete

**Key achievements**:
- Created `web/render.html` with Cycles CLI harness
- Added e2e Playwright tests for pixel verification
- Tests confirm real Cycles WASM rendering (5/5 passing)

**Artifacts**: `web/render.html`, `tests/e2e/render.spec.ts`

---

## Phase 8: Artifact Optimization (zstd)

**Status**: ✅ Complete

**Key achievements**:
- Compressed `cycles.wasm` from 16.3 MB to 3.4 MB (21% ratio, 12.9 MB savings)
- Added `scripts/serve-zstd.mjs` for streaming decompression
- Updated manifest with `compression: "zstd"` field
- Cold start: ~8.2s, warm start: ~180ms (45x speedup from caching)

**Artifacts**: `web/cycles.wasm.zst`, `scripts/serve-zstd.mjs`

---

## Phase 9: Full Blender WASM

**Status**: ✅ Complete

**Key achievements**:
- Built full Blender (`blender.js` + `blender.wasm` + `blender.data`) via `make blender-web`
- Blender WASM with embedded Python (`bpy` API) working in browser
- WASMFS file I/O confirmed working for render output
- `web/blender.html` harness uses `callMain` with Python script execution

**Artifacts**:
| File | Size | GitHub |
|------|------|--------|
| web/blender.js | 749 KB | ✅ committed |
| web/blender.wasm | 143 MB | ❌ too large |
| web/blender.data | 58 MB | ❌ too large |
| web/blender_assets/ | ~50 MB | ✅ committed |

**Known limitations**:
- `blender.wasm` and `blender.data` exceed GitHub file size limits (not committed)
- E2E tests for `blender.html` timeout in headless Chromium (143 MB WASM load >30s)
- Build requires builder machine: 44 GB disk free, 31 GB RAM, 16 cores (~2 hr)
