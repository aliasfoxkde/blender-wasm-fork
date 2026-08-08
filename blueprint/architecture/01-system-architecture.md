# 01 System Architecture

## High-Level Shape

Use three separate layers:

```text
Web Product Layer
  UI, routes, state, downloads, progress, errors, cache controls.

Runtime Adapter Layer
  TypeScript APIs that load and communicate with WASM artifacts.

Blender Build Layer
  Heavy native/WASM build harness, dependency sysroot, source patches, artifact packaging.
```

Do not let the web product layer know CMake/Ninja details.

Do not let the build layer contain product UI logic.

## Recommended Repo Layout

```text
app/
  src/
    components/
    runtime/
    routes/
    styles/
  tests/

blender-build/
  Makefile
  cmake/
  scripts/
  patches/
  web/

runtime/
  manifests/
  schemas/

artifacts/
  .gitkeep

docs/
  decisions/
  build-notes/
  handoff/

scripts/
  audit-artifacts.mjs
  fetch-artifacts.mjs
  verify-pixels.mjs

tests/
  e2e/
```

## Module Boundaries

### Web App

Responsibilities:

- display launch/loading states;
- fetch artifact manifests;
- show progress;
- run render proof;
- display render output;
- handle missing artifact states;
- provide user-facing diagnostics.

Not responsible for:

- compiling Blender;
- patching Blender source;
- creating fake render outputs;
- deciding build flags dynamically.

### Runtime Adapter

Responsibilities:

- load Emscripten JS glue;
- instantiate WASM;
- expose typed API;
- manage filesystem interactions;
- translate WASM errors into app errors;
- return image bytes/results.

Required first adapter:

```text
CyclesRenderRuntime
```

Future adapters:

```text
BlenderCliRuntime
BlenderViewportRuntime
```

### Blender Build Harness

Responsibilities:

- pin Emscripten;
- pin Blender source/fork/ref;
- build dependency sysroot;
- configure Blender/Cycles;
- build target;
- relink for browser;
- package artifacts;
- produce manifest;
- run native/browser verification.

## State Model

Runtime state should use explicit states:

```text
idle
manifest-loading
artifact-missing
downloading
decompressing
instantiating
ready
rendering
render-complete
error
unsupported
```

Never infer runtime readiness from the existence of a canvas.

## Product Modes

### Mode 1: Render Proof

First screen after launch for MVP.

Purpose:

- load real render artifact;
- render sample scene;
- show output.

### Mode 2: Project Shell

Later.

Purpose:

- choose files;
- manage project state;
- cache artifacts;
- display logs.

### Mode 3: Full Blender

Much later.

Purpose:

- interactive Blender UI/runtime.

