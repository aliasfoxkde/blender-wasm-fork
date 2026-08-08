# 02 Build Architecture

## Baseline Choice

Use the HeyPuter-style method as the technical baseline:

- pinned Emscripten;
- pinned Blender fork/ref;
- real dependency sysroot;
- headless Cycles render MVP;
- browser relink step;
- WasmFS/pthreads;
- release artifact packaging.

Either fork `https://github.com/HeyPuter/blender-wasm` or recreate the architecture from it. If copying code, preserve license notices and record upstream commit SHA.

## Build Targets

### Target A: Smoke

Purpose: prove toolchain works.

Output:

```text
blender-build/web/smoke.js
blender-build/web/smoke.wasm
```

### Target B: Cycles Web

Purpose: first real render MVP.

Output:

```text
blender-build/web/cycles.js
blender-build/web/cycles.wasm
blender-build/web/cycles.data
```

### Target C: Packaged Render Artifact

Purpose: app-consumable artifact.

Output:

```text
public/wasm/render/manifest.json
public/wasm/render/render.js
public/wasm/render/render.wasm.zst
public/wasm/render/assets.tar.zst
```

### Target D: Full Blender Web

Purpose: future full Blender runtime.

Output:

```text
public/wasm/blender/manifest.json
public/wasm/blender/blender.js
public/wasm/blender/blender.wasm.zst
public/wasm/blender/assets.tar.zst
```

## Emscripten Policy

Pin the toolchain. Do not use system Emscripten.

Recommended starting point:

```text
EMSDK_VERSION=6.0.1
```

All dependency libraries and target objects must agree on ABI-critical flags:

```text
-pthread
-fexceptions
```

Use SIMD only deliberately. If a dependency breaks because x86 intrinsics are selected, disable the dependency SIMD path instead of globally pretending wasm is x86.

## Dependency Policy

Prefer real dependencies over stubs.

Allowed for MVP:

- disable optional features;
- build only required dependencies;
- use upstream source releases;
- patch cleanly with recorded patches.

Not allowed for MVP completion:

- empty dependency stubs;
- fake headers that let compilation pass but produce nonfunctional runtime behavior;
- no-op render APIs.

## Host Tool Policy

Blender code generation tools must run as host-native tools, not target WASM tools, unless there is a proven node-runner path.

Relevant tools:

```text
makesdna
makesrna
datatoc
shader_tool
```

Each tool must have a documented policy:

```text
tool name:
host/target:
how built:
how invoked:
known cross-ABI caveats:
verification:
```

## Browser Relink Policy

CMake may produce a non-browser JS/WASM executable. The browser artifact should be produced by extracting CMake's exact link command and replacing only runtime/platform flags.

Required browser concepts:

- `-sENVIRONMENT=web,worker`;
- `-sWASMFS`;
- `-sFORCE_FILESYSTEM=1`;
- pthread support;
- memory growth;
- exported runtime methods;
- asset preload or provider filesystem.

## Build Notes

Every heavy build run must produce:

```text
docs/build-notes/YYYY-MM-DD-target.md
```

Required content:

```text
Machine:
CPU:
RAM:
Swap:
Disk free before:
Command:
Elapsed time:
Final artifact paths:
Artifact sizes:
First failing error, if failed:
Next action:
```

