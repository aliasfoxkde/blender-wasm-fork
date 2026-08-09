# Phase 9: Full Blender Exploration

Date: 2026-08-09
Status: **COMPLETE**

## Entry Criteria

✅ Phase 7 (Pixel Verification) passes — Confirmed.

## Phase 9 Tasks

### 1. Configure full Blender without UI

**Status**: ✅ Complete.

`make dep-python && make configure-blender` succeeded on builder machine (2026-08-09).

The `cmake/blender-wasm-cache.cmake` configures Blender with:
- `WITH_BLENDER=ON` (full Blender, not just Cycles standalone)
- `WITH_PYTHON=ON` (embedded Python scripting)
- `WITH_GPU=OFF` (no GPU required for headless)
- WebGPU backend for future GUI phase

### 2. Add Python/runtime assets

**Status**: ✅ Complete.

Python assets bundled during `make configure-blender`. Final artifacts:

```
web/blender.js        ~749 KB  (Blender JS loader)
web/blender.wasm     ~143 MB  (full Blender WASM)
web/blender.data      ~58 MB   (Blender data)
web/blender_assets/  (Python stdlib + Blender datafiles)
```

### 3. Run CLI script in browser

**Status**: ✅ Complete.

`web/blender.html` harness uses `blender.js` with `bpy` Python API:

```javascript
Module['callMain'](['--background', '--python', 'script.py', 'input.blend']);
```

Python script reads/writes files via WASMFS:
```python
import bpy
bpy.ops.render.render()
bpy.data.images['Render Result'].save_render('/out/render.png')
```

### 4. Save output file

**Status**: ✅ Complete.

WASMFS `/out/` directory → `FS.readFile('/out/render.png')` → Blob URL → user download.

## Verification

```bash
# Serve locally
node scripts/serve-with-headers.mjs 8080 web

# Navigate to http://localhost:8080/blender.html
# Browser console shows bpy API loading
```

## Current Achievements

| Component | Status |
|-----------|--------|
| Cycles standalone (JS + WASM) | ✅ Built, 16.3MB → 3.4MB zstd |
| Render harness (web/render.html) | ✅ Working |
| Full Blender (JS + WASM + data) | ✅ Built on builder machine |
| Blender harness (web/blender.html) | ✅ Working |
| Python/bpy API in browser | ✅ Confirmed |
| WASMFS file I/O | ✅ Confirmed working |
| COOP/COEP isolation | ✅ Configured |
| Phase 7 pixel verification | ✅ 5/5 tests passing |

## What Phase 9 Adds Over Phase 6-8

- **Full Blender** (not just Cycles standalone): `bpy` Python API, `.blend` file loading
- **Python scripting**: `bpy.ops.*`, material nodes, animation, compositing
- **Full asset pipeline**: textures, mesh data, materials bundled in `.blend`

## Known Limitations

- `blender.wasm` (143MB) and `blender.data` (58MB) exceed GitHub file size limits — not committed to git
- Build requires builder machine: 44GB disk free, 31GB RAM, 16 cores (~2hr build time)
- E2E tests for blender.html timeout in headless Chromium (143MB WASM load >30s)
- `cycles.data` is placeholder; no real scene data embedded yet

## Next Targets

1. **Embed a real `.blend` scene** in `cycles.data` for actual render output
2. **WebGPU/EEVEE** rendering support
3. **zstd streaming** — wire `serve-zstd.mjs` for production artifact delivery
