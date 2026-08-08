# 06 CI, Artifacts, And Release

## CI Lanes

### PR CI

Fast. No Blender build.

Commands:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit:artifacts
```

### Render Artifact CI

Heavy. Manual or scheduled.

Commands:

```bash
bash blender-build/scripts/setup-toolchain.sh
bash blender-build/scripts/fetch-blender.sh
bash blender-build/scripts/build-deps.sh
bash blender-build/scripts/configure-cycles.sh
bash blender-build/scripts/build-cycles.sh
bash blender-build/scripts/link-cycles-web.sh
node scripts/package-render-artifacts.mjs
node scripts/audit-artifacts.mjs
pnpm exec playwright test tests/e2e/render-proof.spec.ts --project=chromium --workers=1
```

### Full Blender CI

Future only. Manual/self-hosted.

## Required Builder Resources

Render Artifact CI:

```text
CPU: 4+
RAM: 16 GB minimum, 32 GB preferred
Swap: 16 GB
Disk: 80 GB free minimum
Timeout: 4 hours
```

Full Blender CI:

```text
CPU: 8+
RAM: 32 GB minimum, 64 GB preferred
Swap: 32 GB
Disk: 150 GB free
Timeout: 8 hours
```

## Artifact Release Model

Large artifacts should be release assets, not normal git files.

Release package:

```text
render-artifacts-vX.Y.Z.tar.gz
  manifest.json
  render.js
  render.wasm.zst
  assets.tar.zst
  LICENSES/
  BUILD-INFO.txt
```

`BUILD-INFO.txt` must contain:

```text
source remote:
source ref:
emscripten:
dependency versions:
build command:
build date:
artifact sha256:
```

## App Consumption

The app should support:

```text
local development artifact path
release artifact URL
offline cached artifact
```

Do not hardcode one URL in source code. Use config:

```text
VITE_RENDER_ARTIFACT_BASE_URL
```

## Rollback

To disable a bad artifact:

1. remove or rename manifest;
2. app falls back to artifact unavailable state;
3. keep diagnostic baseline available;
4. publish new manifest only after browser e2e passes.

