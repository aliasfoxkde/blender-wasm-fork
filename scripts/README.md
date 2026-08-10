# Scripts Directory

This directory contains build, test, and utility scripts for the Blender WASM project.

## Live Scripts (Used by Makefile or CI)

### Build Scripts (dependency management)
| Script | Purpose |
|--------|---------|
| `build_all_deps.sh` | Builds all WASM dependencies (zlib, fmt, imath, zstd, jpeg, png, etc.) |
| `build_brotli.sh` | Builds Brotli compression library |
| `build_eigen.sh` | Builds Eigen linear algebra library |
| `build_expat.sh` | Builds Expat XML parser |
| `build_fmt.sh` | Builds fmt formatting library |
| `build_freetype.sh` | Builds FreeType font rendering |
| `build_imath.sh` | Builds Imath math library |
| `build_jpeg.sh` | Builds JPEG encoding/decoding |
| `build_libdeflate.sh` | Builds libdeflate compression |
| `build_minizip.sh` | Builds minizip zip handling |
| `build_ocio.sh` | Builds OpenColorIO color management |
| `build_oiio.sh` | Builds OpenImageIO |
| `build_openexr.sh` | Builds OpenEXR image format |
| `build_openjph.sh` | Builds OpenJPH JPEG2000 |
| `build_png.sh` | Builds PNG image format |
| `build_pugixml.sh` | Builds pugixml XML parser |
| `build_pystring.sh` | Builds pystring Python string ops |
| `build_python.sh` | Builds Python 3.13 for WASM |
| `build_robinmap.sh` | Builds robin-map hash map |
| `build_shaderc.sh` | Builds GLSL compiler (shaderc) |
| `build_shader_tool_native.sh` | Builds native shader_tool for codegen (used by `make configure-blender`) |
| `build_spirv_tools.sh` | Builds SPIRV-Tools |
| `build_tbb.sh` | Builds Intel Threading Building Blocks |
| `build_tiff.sh` | Builds TIFF image format |
| `build_tint.sh` | Builds Tint (WGSL compiler) |
| `build_yamlcpp.sh` | Builds YAML-CPP |
| `build_zlib.sh` | Builds zlib |
| `build_zstd.sh` | Builds Zstandard compression |
| `dep_common.sh` | Common functions for dependency build scripts |

### Link Scripts (artifact assembly)
| Script | Purpose |
|--------|---------|
| `link_blender_release.sh` | Links Blender release artifacts for demo (used by build-release.yml) |
| `link_blender_web.sh` | Links full Blender WASM build for browser (used by `make blender-web`) |
| `link_cycles_web.sh` | Relinks Cycles standalone with web-ready flags (used by `make cycles-web`) |

### Serve & Verify Scripts
| Script | Purpose |
|--------|---------|
| `serve.mjs` | Serves the web directory on a port with COOP/COEP headers (used by `make serve`) |
| `verify.mjs` | Playwright verification of rendered output (used by `make verify`, `make verify-render`) |
| `verify_blender_webgpu.mjs` | Verifies Blender WebGPU pipeline (used by `make verify-blender-webgpu`) |
| `verify_webgpu.mjs` | Verifies WebGPU compute pipeline (used by `make verify-webgpu`) |

### Cloudflare R2 Scripts
| Script | Purpose |
|--------|---------|
| `sync-assets.mjs` | Uploads WASM artifacts to Cloudflare R2 via `wrangler r2 object put` |

### Audit Scripts
| Script | Purpose |
|--------|---------|
| `audit-setup.mjs` | Verifies development environment setup (pnpm audit:setup) |
| `audit-artifacts.mjs` | Audits build artifact integrity (pnpm audit:artifacts) |

### Test Scripts (exploratory / development)
| Script | Purpose |
|--------|---------|
| `captex_modeling.mjs` | Captex modeling workflow test |
| `console_render_test.mjs` | Console-based render test |
| `demo_test.mjs` | Demo application test |
| `editflow_test.mjs` | Edit flow UI test |
| `f12_test.mjs` | F12 key / console test |
| `falsecolor_test.mjs` | False color visualization test |
| `gizmo_test.mjs` | Gizmo interaction test |
| `gpu_conformance.mjs` | GPU conformance test |
| `interact_perf_test.mjs` | Interaction performance test |
| `keyframe_test.mjs` | Keyframe animation test |
| `localmount_test.mjs` | Local mount/path test |
| `modeling_boot_test.mjs` | Modeling startup test |
| `outline_test.mjs` | Outline rendering test |
| `persist_test.mjs` | Persistence test |
| `playback_test.mjs` | Animation playback test |
| `prefs_test.mjs` | Preferences test |
| `rclick_test.mjs` | Right-click menu test |
| `rendered_vp_test.mjs` | Rendered viewport test |
| `saveload_test.mjs` | Save/load .blend file test |
| `select_test.mjs` | Selection test |
| `shading_diff_test.mjs` | Shading difference test |
| `swiftshader_test.mjs` | SwiftShader GPU test |
| `transparency_test.mjs` | Transparency rendering test |
| `validate_pipeline.mjs` | Pipeline validation |
| `validate_render.mjs` | Render validation |
| `validate_wgsl.mjs` | WGSL validation |
| `wgslcache_test.mjs` | WGSL caching test |
| `wgsl_dump.mjs` | WGSL shader dumper |
| `wgsl_seed.mjs` | WGSL seed generator |
| `wireframe_test.mjs` | Wireframe rendering test |
| `workspace_test.mjs` | Workspace layout test |

## Deprecated Scripts

Scripts that are no longer used have been moved to `scripts/deprecated/`. These include:
- `gui_bisect.mjs`, `gui_bisect2.mjs` - GUI bisection tools
- `gui_captex.mjs`, `gui_explore.mjs`, `gui_poke.mjs`, `gui_probe.mjs` - Exploratory GUI scripts
- `capture_eevee.mjs`, `capture_eevee_gpu.mjs` - EEVEE capture scripts
- `editmode_test.mjs` - Edit mode test (superseded)
- `probe_*.mjs` - Various GPU probe scripts
- `serve-with-headers.mjs`, `serve-zstd.mjs` - Alternative serve scripts
- `link_blender_node.sh` - Node.js Blender linking (not used; `link_blender_release.sh` is used instead)

## Web HTML Coverage

All HTML entry points have corresponding e2e test coverage:

| HTML File | Test Coverage |
|-----------|---------------|
| `web/smoke.html` | `tests/e2e/smoke-wasm.spec.ts` |
| `web/render.html` | `tests/e2e/render.spec.ts` |
| `web/blender.html` | `tests/e2e/blender.spec.ts` |
