# 17 Testing And Quality Strategy

## Quality Bar

The project is not credible unless browser tests prove real runtime behavior.

The test strategy must catch:

- fake render output;
- missing artifacts;
- broken manifests;
- unsupported browser requirements;
- service worker cache regressions;
- Cloudflare header misconfiguration;
- local storage migration failures;
- runtime errors hidden behind success UI.

## Test Layers

### Unit Tests

Scope:

- manifest validator;
- runtime state machine;
- storage models;
- sync queue;
- error mapping;
- progress calculations.

Command:

```bash
pnpm test
```

### Integration Tests

Scope:

- runtime adapter with mocked Emscripten module;
- artifact loader with test files;
- OPFS/IndexedDB wrapper;
- service worker registration policy.

### Browser E2E Tests

Scope:

- app shell;
- missing artifact state;
- render proof flow;
- pixel verification;
- PWA manifest;
- offline behavior.

Command:

```bash
pnpm exec playwright test
```

### Artifact Tests

Scope:

- manifest schema;
- byte counts;
- sha256;
- required files;
- compressed/decompressed size metadata.

Command:

```bash
pnpm audit:artifacts
```

### Performance Tests

Scope:

- startup timings;
- artifact download/decompress/instantiate;
- first render;
- warm cache startup;
- memory ceiling.

Output:

```text
artifacts/perf/latest.json
```

## Pixel Verification

A render output test must:

1. wait for runtime ready;
2. trigger render;
3. capture image/canvas pixels;
4. ensure width and height are nonzero;
5. sample enough pixels to reject blank/single-color output;
6. optionally compare against a loose baseline histogram.

Minimum rule:

```text
At least N sampled pixels must differ, and alpha must not be all zero.
```

Do not use exact pixel matching for early renderer tests. Browser/runtime differences may create small variation.

## Fake Output Detection

Tests should fail if:

- output image URL points to a bundled static sample not created during the test;
- canvas is drawn by app code instead of runtime output;
- page claims render success before WASM render command returns;
- render output timestamp does not change after rerender.

## Browser Matrix

MVP:

```text
Chromium desktop
```

Near term:

```text
Chrome
Edge
Firefox where supported
Android Chrome for mobile viewer flows
Safari only for app shell/offline where runtime requirements permit
```

Full Blender/WebGPU:

```text
Chromium with WebGPU
Chrome/Edge stable
```

## Deployment Tests

Run against Cloudflare Pages production and previews:

1. app loads;
2. required COOP/COEP headers exist;
3. PWA manifest exists;
4. artifact manifest fetch works;
5. unsupported state is clear if artifacts are absent;
6. no fake success state.

Command:

```bash
BASE_URL=https://example.com pnpm exec playwright test tests/e2e/deployed-smoke.spec.ts
```

## Regression Gates

PR merge requires:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit:artifacts
pnpm exec playwright test tests/e2e/app-shell.spec.ts --project=chromium
```

Render release requires:

```bash
pnpm audit:artifacts
pnpm exec playwright test tests/e2e/render-proof.spec.ts --project=chromium --workers=1
```

## Manual QA Checklist

Before first public demo:

1. Open app in clean browser profile.
2. Verify start page copy is honest.
3. Download artifact.
4. Run sample render.
5. Refresh page and verify cached artifact state.
6. Go offline and verify offline messaging.
7. Test mobile viewport.
8. Test storage cleanup.
9. Test deployment URL from GitHub.

