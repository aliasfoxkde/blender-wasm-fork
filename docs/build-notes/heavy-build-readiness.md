# Heavy Build Readiness

Date: 2026-08-08
Status: ready-for-builder

Do NOT run this build on a developer workstation. Use a dedicated builder machine or CI runner.

## First Target: `make mvp`

`make mvp` runs two steps:

1. `cycles-web` — builds the Cycles headless WASM renderer
2. `verify-render` — Playwright screenshot verification

Outputs go to `web/` and `demo/public/`.

## Required Machine Resources

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 16 GB | 32 GB |
| Disk free | 50 GB | 100 GB |
| CPU cores | 8 | 16+ |
| Swap | 8 GB | 16 GB |
| OS | Linux (x86_64) | Linux (x86_64) |

Building on macOS or ARM may work but is untested in this fork.

## Expected Outputs

After `make mvp` succeeds, these files should exist in `demo/public/`:

```text
demo/public/blender.js
demo/public/blender.wasm.zst
demo/public/assets.tar.zst
demo/public/manifest.json
demo/public/wgsl-cache.json
```

Run `pnpm audit:artifacts` to verify.

## Log Capture Command

On the builder machine:

```bash
mkdir -p artifacts/logs
time make mvp 2>&1 | tee artifacts/logs/make-mvp.log
```

## Expected Duration

| Step | Approximate time |
|---|---|
| `make toolchain` (emsdk install) | 5–15 min |
| `make deps` (all deps) | 30–90 min |
| `make cycles` (Cycles build) | 15–30 min |
| `make cycles-web` (relink) | 1–5 min |
| `make verify-render` (Playwright) | 2–5 min |
| **Total** | **~1–2.5 hours** |

Times vary by CPU, RAM, disk speed, and network.

## Failure Report Template

If the build fails, capture and report:

```text
## Failure Report

Command: make mvp
Time: YYYY-MM-DD HH:MM UTC
Machine: <CPU, RAM, OS, disk type>

## First Failing Error

< paste the first error message >

## Full Log

< attach artifacts/logs/make-mvp.log >

## Artifact Audit

$ pnpm audit:artifacts
< output >
```

Do NOT patch random dependencies. Stop and report.

## Post-Build Verification

After a successful `make mvp`:

```bash
# Verify artifacts exist
pnpm audit:artifacts

# Verify demo builds
cd demo && pnpm build
```

## Next Targets (After MVP)

Once `make mvp` passes and artifacts are verified:

```bash
# Full Blender with WebGPU
make configure-blender
make blender-web
make verify-blender-webgpu
```

## Artifact Sizes (Expected)

After `make mvp`:

```text
blender.js        ~200–500 KB  (gzip)
blender.wasm.zst  ~15–30 MB    (compressed)
assets.tar.zst    ~20–50 MB    (compressed)
manifest.json     ~1–2 KB
wgsl-cache.json   ~10–500 KB
```

Exact sizes depend on the Blender fork ref and asset set.
