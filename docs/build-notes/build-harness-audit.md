# Build Harness Audit

Date: 2026-08-08
Status: validated

## Shell Scripts (`bash -n`)

All 34 shell scripts pass `bash -n` syntax validation:

```bash
scripts/build_all_deps.sh     OK
scripts/build_brotli.sh       OK
scripts/build_eigen.sh        OK
scripts/build_expat.sh         OK
scripts/build_fmt.sh          OK
scripts/build_freetype.sh      OK
scripts/build_imath.sh        OK
scripts/build_jpeg.sh         OK
scripts/build_libdeflate.sh   OK
scripts/build_minizip.sh      OK
scripts/build_ocio.sh         OK
scripts/build_oiio.sh         OK
scripts/build_openexr.sh     OK
scripts/build_openjph.sh     OK
scripts/build_png.sh          OK
scripts/build_pugixml.sh      OK
scripts/build_pystring.sh     OK
scripts/build_python.sh       OK
scripts/build_robinmap.sh     OK
scripts/build_shaderc.sh      OK
scripts/build_shader_tool_native.sh OK
scripts/build_spirv_tools.sh  OK
scripts/build_tbb.sh          OK
scripts/build_tiff.sh         OK
scripts/build_tint.sh         OK
scripts/build_yamlcpp.sh      OK
scripts/build_zlib.sh         OK
scripts/build_zstd.sh        OK
scripts/dep_common.sh        OK
scripts/link_blender_node.sh  OK
scripts/link_blender_release.sh OK
scripts/link_blender_web.sh  OK
scripts/link_cycles_web.sh   OK
```

## Pinned Config

| Key | Value | Location |
|---|---|---|
| `EMSDK_VERSION` | `6.0.1` | Makefile |
| `BLENDER_URL` | `https://github.com/HeyPuter/blender` | Makefile |
| `BLENDER_REF` | `6b031d3d41c392883e3c495aa72343e10d15b43d` | Makefile |

## Makefile Targets

| Target | Purpose | Local Safety |
|---|---|---|
| `make smoke` | Toolchain smoke test | Safe |
| `make mvp` | Cycles headless render | Heavy — needs builder |
| `make cycles-web` | Relink Cycles for browser | Heavy |
| `make configure-blender` | Configure full Blender | Very heavy |
| `make blender-web` | Full Blender browser relink | Very heavy |

## CI Policy

No heavy build targets run in PR CI:

```bash
# CI runs only:
pnpm audit:setup
pnpm audit:artifacts
bash -n scripts/*.sh
cd demo && pnpm build
pnpm --filter blender-wasm-app typecheck
pnpm --filter blender-wasm-app test
pnpm --filter blender-wasm-app build
```

## Smoke Test

The `smoke/smoke.c` exercises pthreads + SIMD128 (Mandelbrot fractal, 8 bands).
Build with `make smoke` → outputs to `web/smoke.html`.
Playwright test at `tests/e2e/smoke-wasm.spec.ts`.

## Next: Build Cycles Artifact

```bash
time make mvp 2>&1 | tee artifacts/logs/make-mvp.log
```

See `docs/build-notes/heavy-build-readiness.md` for full requirements.
