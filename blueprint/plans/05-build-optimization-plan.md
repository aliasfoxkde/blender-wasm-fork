# 05 Build Optimization Plan

## Optimization Principles

1. Optimize build architecture before compiler flags.
2. Cache dependencies aggressively.
3. Separate frontend CI from heavy build CI.
4. Build the smallest target that proves the next product milestone.
5. Measure artifact size, build time, startup time, render time, and memory.

## Avoid Local Machine Freezes

Never run:

```bash
ninja -j$(nproc)
```

for Blender-scale targets on a normal workstation.

Use:

```bash
BUILD_JOBS=2
```

or run on a dedicated builder.

## Dependency Caching

Cache these separately:

```text
emsdk/
deps/downloads/
wasm-sysroot/
build-cycles/
```

CI cache keys should include:

```text
OS
EMSDK_VERSION
BLENDER_REF
dependency script hashes
cmake cache hash
```

## Build Phases To Cache

### Toolchain Cache

Invalidated by:

- `EMSDK_VERSION` change.

### Dependency Sysroot Cache

Invalidated by:

- dependency script changes;
- dependency version changes;
- ABI flag changes;
- Emscripten version changes.

### Blender Configure Cache

Invalidated by:

- Blender ref changes;
- CMake cache changes;
- sysroot changes.

### Artifact Cache

Invalidated by:

- source ref;
- link flags;
- runtime JS libraries;
- asset bundle changes.

## Artifact Size Optimization

Apply in this order:

1. Disable unused Blender features.
2. Reduce bundled assets.
3. Use production optimization flags.
4. Compress WASM/assets.
5. Lazy-load optional assets.
6. Consider symbol stripping only after debugging is stable.

Do not strip so aggressively that crashes become impossible to diagnose during MVP.

## Startup Optimization

Measure:

```text
manifest fetch time
WASM download time
WASM decompression time
WASM instantiate time
asset mount time
first render time
```

Add a JSON performance log:

```json
{
  "manifestMs": 0,
  "downloadMs": 0,
  "decompressMs": 0,
  "instantiateMs": 0,
  "mountMs": 0,
  "firstRenderMs": 0
}
```

## Runtime Memory Optimization

Start with safe memory:

```text
INITIAL_MEMORY=512MB for headless render
MAXIMUM_MEMORY=2GB for headless render
```

Only increase after recording the failure.

Full Blender may need:

```text
INITIAL_MEMORY=1GB
MAXIMUM_MEMORY=4GB
```

Do not use those settings for the first render proof unless required.

## Build Matrix

Use profiles:

```text
debug
  assertions on
  symbols on
  smaller scenes

release
  optimized
  compressed artifacts
  e2e pixel verification

full-debug
  only on self-hosted builder
```

## Stop Rule

If an optimization requires more than one day of investigation, record it and continue with the simpler known-working path. Correctness comes before optimization until the first real render passes.

