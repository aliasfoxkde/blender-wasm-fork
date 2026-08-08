# 11 Web Performance And PWA

## Performance Goal

The app must feel responsive even when the underlying WASM artifact is large.

Perceived performance matters because Blender-scale WASM startup may take real time. The UI must make progress understandable and keep the page interactive.

## Performance Metrics

Track these separately:

```text
time to app shell
time to manifest
time to artifact download start
time to artifact download complete
time to decompression complete
time to WASM instantiate
time to runtime ready
time to first render start
time to first rendered image
warm start time
memory peak
artifact cache hit rate
```

## Perceived Performance Methods

### App Shell First

Render the app shell immediately. Do not wait for WASM to draw the first screen.

The first paint should show:

- product title;
- current phase;
- browser support status;
- artifact status;
- action button or next step.

### Progressive Disclosure

Do not show every technical log line by default.

Default view:

- phase;
- progress;
- next action;
- concise error.

Advanced drawer:

- full logs;
- artifact manifest;
- source ref;
- memory config;
- browser capabilities.

### Parallel Work

Where possible:

- fetch manifest while profiling browser;
- prefetch JS glue while user reviews artifact size;
- download artifact and assets concurrently;
- prepare UI state while WASM instantiates.

### Chunked Work

Avoid blocking the UI thread:

- stream downloads;
- use workers for decompression if practical;
- use `requestIdleCallback` for noncritical metadata;
- batch logs;
- virtualize long log output.

### Warm Cache

After first successful run:

- cache manifest;
- cache artifacts;
- cache recent render outputs;
- remember last good artifact version;
- provide a `Use cached runtime` path when offline.

## PWA Requirements

### Installability

Provide:

- `manifest.webmanifest`;
- icons;
- theme color;
- display mode;
- start URL.

### Offline Behavior

Offline support should be honest:

```text
If runtime artifacts and project files are cached, the render proof can run offline.
If they are not cached, the app opens but render is unavailable.
```

Do not claim offline support just because the app shell is cached.

### Service Worker Strategy

Use different cache policies:

| Resource | Strategy |
|---|---|
| app shell JS/CSS | stale-while-revalidate |
| manifest | network-first with cached fallback |
| WASM artifacts | cache-first with versioned URLs |
| assets tar | cache-first with versioned URLs |
| user projects | OPFS/local DB first, cloud sync separately |
| render outputs | local cache with quota management |

## Storage Quota

Before downloading large artifacts:

1. Query storage estimate.
2. Compare available quota with artifact size.
3. Warn if insufficient.
4. Offer cleanup.

Example UI:

```text
This runtime needs 420 MB. Your browser reports about 900 MB available.
```

## Memory Pressure

Detect and explain failures:

- WASM memory allocation failure;
- browser tab killed;
- worker startup failure;
- SharedArrayBuffer unavailable.

Do not silently retry large startup loops.

## Responsive Layout

Desktop:

- multi-panel workspace;
- logs drawer;
- side controls.

Tablet:

- two-pane layout;
- controls slide over output.

Mobile:

- single-column;
- output first after render;
- collapsible controls/logs;
- avoid unnecessary large downloads on cellular.

## Web Vitals

Target:

```text
LCP for app shell: under 2.5s on broadband
CLS: near zero
INP: keep controls responsive during loading
```

WASM runtime readiness can be slower, but must show useful progress.

## Optimization Backlog

1. Zstd-compressed WASM/assets.
2. Versioned CDN caching.
3. Range requests if supported by artifact hosting.
4. Worker-based decompression.
5. Streaming instantiate when uncompressed WASM is used.
6. Preload manifest.
7. Prefetch next likely artifact version.
8. OPFS artifact cache.
9. Render output thumbnails.
10. Device-specific artifact variants.

