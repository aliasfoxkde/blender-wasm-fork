# 04 Implementation Roadmap

## Phase 0: New Repo Setup

Tasks:

1. Create new repo.
2. Decide fork strategy:

   ```text
   Option A: fork HeyPuter/blender-wasm and add app shell.
   Option B: create clean repo and vendor/adapt build harness.
   ```

3. Add this blueprint under `docs/greenfield-blueprint/`.
4. Add root `.gitignore`.
5. Add root `README.md` explaining real-render-first strategy.

Acceptance:

- repo has no fake viewport;
- docs state first MVP clearly.

## Phase 1: App Shell

Tasks:

1. Create web app with Vite.
2. Add one route: `/render-proof`.
3. Add `RenderProofPanel`.
4. Add static states:

   - artifact missing;
   - loading;
   - ready;
   - rendering;
   - success;
   - error.

5. Add tests for state transitions.

Acceptance:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Phase 2: Artifact Manifest

Tasks:

1. Add manifest schema.
2. Add manifest validator.
3. Add `scripts/audit-artifacts.mjs`.
4. Add tests for:

   - missing manifest;
   - valid manifest;
   - missing file;
   - wrong byte size;
   - bad schema.

Acceptance:

```bash
pnpm audit:artifacts
pnpm test
```

## Phase 3: Build Harness Import

Tasks:

1. Add `blender-build/`.
2. Add pinned config:

   ```text
   EMSDK_VERSION
   BLENDER_REMOTE
   BLENDER_REF
   BUILD_JOBS
   ```

3. Add toolchain setup script.
4. Add Blender fetch script.
5. Add dependency helper script.
6. Add build notes template.

Acceptance:

- scripts pass `bash -n`;
- no heavy build runs in normal CI.

## Phase 4: Smoke WASM

Tasks:

1. Build tiny C smoke module.
2. Serve it with required headers.
3. Add Playwright test proving WASM loads.

Acceptance:

```bash
pnpm exec playwright test tests/e2e/smoke-wasm.spec.ts
```

## Phase 5: Cycles Build

Tasks:

1. Build dependency subset.
2. Configure Cycles standalone.
3. Build `cycles`.
4. Relink for browser.
5. Package artifacts.

Acceptance:

- artifact manifest generated;
- artifact audit passes;
- build note includes elapsed time and sizes.

## Phase 6: Runtime Integration

Tasks:

1. Implement `CyclesRenderRuntime`.
2. Load artifact manifest.
3. Instantiate module.
4. Run render command.
5. Read output bytes.
6. Display output image.

Acceptance:

```bash
pnpm test
pnpm build
```

## Phase 7: Pixel Verification

Tasks:

1. Add e2e render test.
2. Render sample scene.
3. Inspect pixels.
4. Fail on blank/single-color output.

Acceptance:

```bash
pnpm exec playwright test tests/e2e/render-proof.spec.ts --project=chromium --workers=1
```

## Phase 8: Artifact Optimization

Tasks:

1. Compress WASM with zstd.
2. Compress assets with zstd.
3. Add streaming progress.
4. Cache artifacts.
5. Measure cold start and warm start.

Acceptance:

- metrics recorded;
- no regressions in pixel verification.

## Phase 9: Full Blender Exploration

Entry criteria:

- Phase 7 passes.

Tasks:

1. Configure full Blender without UI.
2. Add Python/runtime assets.
3. Run CLI script in browser.
4. Save output file.

Acceptance:

- browser test proves real Blender script execution.

