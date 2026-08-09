# Phase 5: Cycles Build — Build Note

Date: 2026-08-09
Status: MVP artifacts produced

## Build Environment

| Item | Value |
|------|-------|
| Machine | Local dev (31GB RAM, 16 cores) |
| emsdk | 6.0.1 (installed manually) |
| Blender ref | 6b031d3d41c392883e3c495aa72343e10d15b43d |
| EMSDK_VERSION | 6.0.1 |
| Build time | ~40 min (local, -j8) |

## Build Commands

```bash
# One-time emsdk setup
git clone --depth 1 https://github.com/emscripten-core/emsdk.git emsdk
cd emsdk && ./emsdk install 6.0.1 && ./emsdk activate 6.0.1

# Git LFS (fork doesn't host LFS objects — pull from upstream)
cd blender
git config lfs.url "https://projects.blender.org/blender/blender.git/info/lfs"
git config lfs."https://projects.blender.org/blender/blender.git/info/lfs".access none
GIT_TERMINAL_PROMPT=0 git lfs pull

# Build cycles
make -j8 cycles-web
```

## Issues Encountered

1. **Port conflict on first verify-render**: `verify-render` raced with `cycles-web` build.
   - Fix: Build `cycles-web` first, then `verify-render` separately.
2. **Missing `web/scenes` directory**: `link_cycles_web.sh` uses `--preload-file $WEB/scenes@/scenes`.
   - Fix: `mkdir -p web/scenes` before `make cycles-web` or `bash scripts/link_cycles_web.sh`.
3. **Git LFS pointer checkout**: Fork GitHub LFS storage doesn't host LFS objects.
   - Fix: Configure LFS to pull from `projects.blender.org` upstream.

## Artifacts Produced

| File | Size |
|------|------|
| demo/public/cycles.js | 199.3 KB |
| demo/public/cycles.wasm | 16.31 MB |
| demo/public/cycles.data | 12 B |
| demo/public/manifest.json | 759 B |
| web/cycles.js | 204 KB |
| web/cycles.wasm | 17 MB |

## Artifact Audit

```
PASS: artifact audit complete
  OK  cycles.js      199.3 KB
  OK  cycles.wasm    16.31 MB
  OK  cycles.data    12 B
  OK  manifest.json  759 B
```

## Next Steps

1. **Phase 6**: Wire `CyclesRenderRuntime` to load `cycles.{js,wasm,data}` + `manifest.json`
2. **Phase 7**: Create `render.html` with Cycles CLI harness, add e2e pixel verification
3. **Phase 8**: Compress `cycles.wasm` with zstd, measure cold/warm start
4. **Phase 9**: Full Blender CLI in browser (depends on Phase 7)

## Known Limitations

- `cycles.data` is empty (12 bytes) — scenes directory is a placeholder
- No actual .blend file rendered yet — Phase 6/7 wire the render harness
- `cycles.wasm` is not zstd-compressed yet (Phase 8)
