# 22 First Week Execution Plan

This plan is optimized for the current fork. It assumes the HeyPuter build harness is present and the blueprint folder is named `blueprint/`.

## Goal For Week 1

Create a stable, handoff-ready project foundation without running the multi-hour Blender build locally.

Week 1 is successful when:

1. remotes are safe;
2. lightweight audits pass;
3. fast CI exists;
4. artifact audit exists;
5. the demo/app has honest missing-artifact behavior;
6. Cloudflare deployment prerequisites are present;
7. the next heavy build can be run on CI/self-hosted builder with clear commands.

## Day 0: Remote And Safety Setup

Owner: Claude Code

Steps:

1. Check remotes:

   ```bash
   git remote -v
   ```

2. If `origin` points to upstream, fix it:

   ```bash
   git remote rename origin upstream
   git remote add origin <user-fork-url>
   git fetch origin
   ```

3. Run:

   ```bash
   pnpm audit:setup
   cd demo
   pnpm build
   ```

4. Confirm heavy commands are not run locally:

   ```text
   make mvp
   make cycles-web
   make blender-web
   ```

Acceptance:

- `origin` points to user fork;
- `upstream` points to HeyPuter;
- setup audit passes;
- demo build passes.

## Day 1: Fast CI

Owner: MiniMax, reviewed by Claude

Add:

```text
.github/workflows/ci.yml
```

Workflow requirements:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [master, main]
jobs:
  fast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit:setup
      - run: pnpm install --frozen-lockfile
        working-directory: demo
      - run: pnpm build
        working-directory: demo
```

Rules:

- no `make mvp`;
- no `make deps`;
- no Blender source checkout;
- no artifact release.

Acceptance:

- workflow syntax valid;
- CI does not include heavy build commands.

## Day 2: Artifact Audit

Owner: MiniMax

Add:

```text
scripts/audit-artifacts.mjs
```

Add package script:

```json
"audit:artifacts": "node scripts/audit-artifacts.mjs"
```

Audit targets:

```text
demo/public/blender.js
demo/public/blender.wasm.zst
demo/public/assets.tar.zst
demo/public/manifest.json
demo/public/wgsl-cache.json
```

Rules:

- if none exist, print `SKIP: no render artifacts present` and exit 0;
- if manifest exists, required files must exist;
- if files exist without manifest, exit nonzero;
- validate manifest JSON;
- print sizes;
- do not build anything.

Acceptance:

```bash
pnpm audit:artifacts
pnpm audit:setup
```

## Day 3: Honest Demo States

Owner: MiniMax, reviewed by Claude

Inspect:

```text
demo/src/main.js
demo/index.html
demo/src/styles.css
```

Tasks:

1. Ensure missing `manifest.json` shows a clear unavailable state.
2. Ensure missing `blender.wasm.zst` does not show launch success.
3. Ensure the app does not render fake Blender output.
4. Add or improve startup log messages.
5. Keep existing HeyPuter loading behavior intact when artifacts exist.

Acceptance:

```bash
cd demo
pnpm build
```

Manual browser check:

- no artifacts: clear missing-artifact message;
- no fake render success.

## Day 4: Cloudflare Pages Prep

Owner: MiniMax

Tasks:

1. Confirm `demo/public/_headers`.
2. Add deployment doc specific to the fork:

   ```text
   docs/deployment/cloudflare-pages.md
   ```

3. Add `demo/public/robots.txt`.
4. Add `demo/public/site.webmanifest` only if Vite/demo does not already emit one.
5. Document build settings:

   ```text
   Root directory: demo
   Build command: pnpm install --frozen-lockfile && pnpm build
   Output directory: dist
   Node version: 22
   ```

Acceptance:

- demo build passes;
- `_headers` is copied into `dist`.

## Day 5: Heavy Build Readiness

Owner: Claude Code

Do not run the heavy build locally.

Create:

```text
docs/build-notes/heavy-build-readiness.md
```

Include:

- exact target to run first: `make mvp`;
- required machine resources;
- expected outputs;
- log capture command;
- failure report template;
- artifact audit command.

Recommended heavy command on builder:

```bash
time make mvp 2>&1 | tee artifacts/logs/make-mvp.log
```

Acceptance:

- build note exists;
- Claude/MiniMax can hand the command to a builder without guessing.

## End Of Week Gate

Do not proceed to product UI rewrites or full Blender UI until:

```bash
pnpm audit:setup
pnpm audit:artifacts
cd demo && pnpm build
```

passes and the fork remote is safe.

