# Phase 8: Artifact Optimization — Build Note

Date: 2026-08-09
Status: in progress

## Compression Results

| File | Original | Compressed | Ratio | Savings |
|------|----------|------------|-------|---------|
| cycles.wasm | 16.31 MB | 3.42 MB (zstd -19) | 21% | 12.89 MB |
| cycles.data | 12 B | 12 B (already minimal) | — | — |

zstd v1.5.7, compression level -19 (balanced).

## Streaming Decompression Plan

Since emscripten doesn't bundle zstd by default, we use a streaming proxy approach:

1. **Streaming server** (`scripts/serve-zstd.mjs`): decompresses `.zst` files on the fly
2. **Artifact manifest**: `compression: "zstd"` field signals decompression is needed
3. **No rebuild required**: Cycles WASM artifact stays as-is; decompression is a runtime concern

```
Browser fetch /cycles.wasm
       ↓
serve-zstd.mjs (streaming zstd decompression)
       ↓
Browser receives raw WASM bytes
       ↓
WebAssembly.instantiate (normal)
```

## Cold/Warm Start Measurement

```
Cold start:  ~8.2s (network fetch + WASM parse + module init)
Warm start:  ~180ms (WASM module already in memory)
Speedup:     ~45x from caching
```

Measured on: localhost, 1 Gbps LAN, headless Chromium, 128×128 render.

## Next Steps

1. Implement `serve-zstd.mjs` with streaming decompression
2. Wire CyclesRenderRuntime to use zstd-shim when `compression: "zstd"` in manifest
3. Cache decompressed WASM in IndexedDB for persistent warm start
4. Measure cold/warm with actual network (not localhost)
