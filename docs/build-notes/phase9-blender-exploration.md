# Phase 9: Full Blender Exploration

Date: 2026-08-09
Status: blocked — requires builder machine

## Entry Criteria

✅ Phase 7 (Pixel Verification) passes — Confirmed.

## Phase 9 Tasks

### 1. Configure full Blender without UI

**Status**: Blocked. `make configure-blender` requires:
- `dep-python` target (not yet defined in Makefile)
- Full dep stack (`make deps`)
- ~60GB disk, 16GB+ RAM, 1hr+ build time on builder machine

The `cmake/blender-wasm-cache.cmake` configures Blender with:
- `WITH_BLENDER=ON` (full Blender, not just Cycles standalone)
- `WITH_PYTHON=ON` (embedded Python scripting)
- `WITH_GPU=OFF` (no GPU required for headless)
- WebGPU backend for future GUI phase

### 2. Add Python/runtime assets

**Status**: Blocked on task 1.

Python assets are bundled during the Blender CMake configure step (`make configure-blender`). These get included in `build-blender/` and linked into the final `blender-web` artifact.

### 3. Run CLI script in browser

**Status**: Ready to implement once artifacts exist.

The harness will be similar to `web/render.html` but using `blender.js` (full Blender) instead of `cycles.js` (standalone Cycles):

```javascript
// blender-web harness concept
Module['callMain'](['--background', '--python', 'script.py', 'input.blend']);
```

Python script reads/writes files via WASMFS:
```python
import bpy
bpy.ops.render.render()
bpy.data.images['Render Result'].save_render('/out/render.png')
```

### 4. Save output file

**Status**: Ready to implement once artifacts exist.

WASMFS `/out/` directory → `FS.readFile('/out/render.png')` → Blob URL → user download.

## Path Forward

To complete Phase 9:

```bash
# 1. Define dep-python in Makefile (builds CPython 3.x for WASM)
# 2. Run full Blender configure + build
make configure-blender
make blender-web

# 3. Verify in browser
node scripts/serve-zstd.mjs 8080 web
# Navigate to http://localhost:8080/blender.html
```

## Current Achievements

| Component | Status |
|-----------|--------|
| Cycles standalone (JS + WASM) | ✅ Built, 16.3MB → 3.4MB zstd |
| Render harness (web/render.html) | ✅ Working |
| WASMFS file I/O | ✅ Confirmed working |
| COOP/COEP isolation | ✅ Configured |
| Phase 7 pixel verification | ✅ 5/5 tests passing |

## What Phase 9 Adds Over Phase 6-8

- **Full Blender** (not just Cycles standalone): `bpy` Python API, `.blend` file loading
- **Python scripting**: `bpy.ops.*`, material nodes, animation, compositing
- **Full asset pipeline**: textures, mesh data, materials bundled in `.blend`

## Blocker Detail

The `Makefile` line:
```
configure-blender: toolchain blender blender-assets deps dep-python
```

The `dep-python` target does not exist in the Makefile. It needs to be added (similar to `scripts/build_python.sh` pattern) before `make configure-blender` can run.
