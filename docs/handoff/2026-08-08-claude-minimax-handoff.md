# Claude/MiniMax Handoff: Blender WASM Fork

Date: 2026-08-08
Repo: `/nas/Temp/repos/blender-wasm-fork`
Base: `https://github.com/HeyPuter/blender-wasm`

## Audit Summary

This repo is a direct fork/clone of HeyPuter's Blender WASM build harness plus the copied greenfield blueprint.

Current important files:

```text
Makefile
.github/workflows/build-release.yml
scripts/link_cycles_web.sh
scripts/link_blender_release.sh
scripts/build_all_deps.sh
cmake/cycles-wasm-cache.cmake
cmake/blender-wasm-cache.cmake
demo/src/main.js
demo/vite.config.js
blueprint/
```

## Current Strength

Unlike the prior experimental repo, this fork already has the right kind of upstream build strategy:

- pinned Emscripten;
- pinned Blender fork/ref;
- real dependency sysroot scripts;
- headless Cycles browser target;
- full Blender/WebGPU exploration path;
- browser relink scripts;
- zstd artifact packaging;
- WasmFS/provider filesystem work;
- Playwright verification scripts.

## Current Gaps

The repo still needs productization:

- root README was minimal before this handoff;
- no clear agent instructions before this handoff;
- no lightweight setup audit before this handoff;
- remote may still point to upstream, not user's fork;
- demo is upstream-oriented rather than product-shell-oriented;
- heavy build workflow is not separated from fast PR validation;
- artifact manifest/product contracts need implementation;
- Cloudflare deployment config needed `_headers`;
- auth/storage/PWA/product roadmap is only in blueprint docs.

## Critical Remote Check

Run:

```bash
git remote -v
```

Expected:

```text
origin   https://github.com/aliasfoxkde/blender-wasm-fork.git
upstream https://github.com/HeyPuter/blender-wasm.git fetch only
```

Keep upstream push disabled:

```bash
git remote set-url --push upstream DISABLED_UPSTREAM_PUSH
```

Do not push to upstream.

## Safe Local Validation

Run:

```bash
pnpm install
pnpm audit:setup
cd demo
pnpm install
pnpm build
```

Do not run `make mvp`, `make cycles-web`, or `make blender-web` locally unless explicitly approved.

## First Implementation Plan

### Phase 1: Repo Hygiene

1. Confirm fork remote.
2. Confirm `pnpm audit:setup` passes.
3. Confirm `demo/public/_headers` exists.
4. Confirm README/CLAUDE/AGENTS docs are present.
5. Commit/push hygiene docs.

### Phase 2: Fast CI

Add a fast CI workflow that does not build Blender:

```bash
pnpm install --frozen-lockfile
pnpm audit:setup
cd demo
pnpm install --frozen-lockfile
pnpm build
```

Do not modify the heavy release workflow until fast CI exists.

### Phase 3: Artifact Manifest Audit

Implement `scripts/audit-artifacts.mjs` for the actual demo artifact set:

```text
demo/public/blender.js
demo/public/blender.wasm.zst
demo/public/assets.tar.zst
demo/public/manifest.json
```

Rules:

- exit zero with `SKIP` if artifacts are absent;
- exit nonzero if manifest exists but files are missing;
- check sizes if manifest has sizes;
- never build artifacts.

### Phase 4: Product Shell Planning

Decide whether to:

1. adapt `demo/` into the product app; or
2. add a new `app/` and keep `demo/` as upstream reference.

Recommended: keep `demo/` as upstream reference until first artifact is verified, then add product shell separately.

### Phase 5: Heavy Build On Builder

Only after phases 1-4:

```bash
make mvp
```

Run on a machine with enough RAM/disk/swap. Record:

- CPU;
- RAM;
- swap;
- disk free;
- elapsed time;
- artifact sizes;
- first failing error if any.

## MiniMax Rules

MiniMax should work from `blueprint/plans/21-agent-task-backlog.md` and
`blueprint/agents/23-claude-minimax-workflow.md`, completing small tickets only.

Every MiniMax result must report:

```text
Files changed:
Commands run:
Result:
Known limitations:
Next ticket:
```
