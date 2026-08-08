# 15 Greenfield Bootstrap Checklist

This is the exact startup checklist for creating the new project.

## Choose The Base

Pick one.

### Option A: Fork HeyPuter

Use this if the priority is reaching real Blender/Cycles output fastest.

Steps:

1. Fork `https://github.com/HeyPuter/blender-wasm`.
2. Rename the fork or create a new repo from it.
3. Record upstream:

   ```bash
   git remote -v
   git rev-parse HEAD
   ```

4. Add this blueprint under:

   ```text
   docs/greenfield-blueprint/
   ```

5. Create a branch:

   ```bash
   git checkout -b product-shell
   ```

6. Do not rewrite the build harness until one render artifact is verified.

### Option B: New Repo With Imported Harness

Use this if the priority is clean product architecture and long-term maintainability.

Steps:

1. Create empty repo.
2. Add `README.md`.
3. Add this blueprint under:

   ```text
   docs/greenfield-blueprint/
   ```

4. Add app shell.
5. Add artifact manifest tooling.
6. Import build harness files from HeyPuter-style architecture only after the app shell and artifact audit exist.

## Initial Commit Sequence

Use small commits:

```text
commit 1: docs: add greenfield blueprint
commit 2: chore: scaffold app shell
commit 3: chore: add artifact manifest schema and audit
commit 4: chore: add build harness skeleton
commit 5: test: add smoke browser tests
```

## Required Root Files

```text
README.md
LICENSE
.gitignore
.editorconfig
package.json
pnpm-workspace.yaml
docs/
app/
blender-build/
runtime/
scripts/
tests/
```

## Required `.gitignore`

```text
node_modules/
dist/
coverage/
playwright-report/
test-results/

artifacts/*
!artifacts/.gitkeep

blender-build/emsdk/
blender-build/blender/
blender-build/deps/
blender-build/wasm-sysroot/
blender-build/build-cycles/
blender-build/build-blender/
blender-build/web/*.wasm
blender-build/web/*.wasm.zst
blender-build/web/*.data
blender-build/web/*.tar
blender-build/web/*.tar.zst

public/wasm/render/*.wasm
public/wasm/render/*.wasm.zst
public/wasm/render/*.data
public/wasm/render/*.tar.zst
```

## First App Scaffold

Recommended stack:

```text
Vite
TypeScript
Solid or React
Playwright
Vitest
ESLint
Cloudflare Pages
```

If choosing between Solid and React:

- Solid is smaller and fast.
- React has a larger ecosystem.

Either is acceptable. Do not spend more than one planning pass on the choice.

## First Smoke Screen

The initial app screen should have:

- project title;
- browser support status;
- artifact manifest status;
- render proof panel placeholder state;
- runtime logs drawer;
- clear note that no full Blender UI is present.

It must not have:

- fake viewport;
- cube animation;
- placeholder render image.

## First Environment Variables

```text
VITE_APP_ENV=development
VITE_RENDER_ARTIFACT_BASE_URL=/wasm/render/
VITE_ENABLE_REAL_RENDER=false
VITE_ENABLE_AUTH=false
```

## First Acceptance Commands

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright test
```

## Bootstrap Done Criteria

Bootstrap is done when:

1. app shell loads locally;
2. artifact audit exists;
3. missing-artifact state is clear;
4. docs are committed;
5. CI runs frontend checks;
6. no heavy build runs in PR CI.

