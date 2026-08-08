# Blender Web Runtime

This repository is a fork of the HeyPuter Blender WASM work, with an added greenfield planning package for turning the build harness into a product-grade browser Blender runtime.

Upstream base:

```text
https://github.com/HeyPuter/blender-wasm
```

Current upstream commit at fork time:

```text
7513e34 ChromeOS guide
```

## Project Direction

The project should be built in layers:

```text
1. Real render proof
   Browser runs a real Blender-family WASM render module and displays verified pixels.

2. Useful browser render tool
   Local project library, render history, export, cache, PWA/offline behavior.

3. Blender CLI runtime
   Real Blender command/script behavior, assets, Python, save/load proof.

4. Interactive Blender
   WebGPU viewport, real object interaction, editing workflows.
```

Do not start by building a fake viewport. Do not present Canvas/WebGL/Three.js placeholder output as Blender output.

## Current Repo Contents

| Path | Purpose |
|---|---|
| `Makefile` | Upstream heavy build orchestration for Emscripten, deps, Cycles, full Blender/WebGPU experiments |
| `scripts/` | Dependency builders, linker scripts, Playwright verification probes |
| `cmake/` | Blender/Cycles WASM CMake cache files and compatibility shim |
| `demo/` | Upstream browser demo shell |
| `blueprint/` | Product architecture, planning, CI, deployment, auth/storage, QA, and agent handoff docs |
| `CLAUDE.md` | Claude Code CLI working instructions |
| `AGENTS.md` | General implementation-agent instructions |
| `docs/devops/` | Issue, branch, PR, pipeline, and observability workflow |
| `docs/handoff/` | Dated audit and next-step handoff |

## Start Here

For product architecture and implementation planning:

```text
blueprint/README.md
docs/handoff/2026-08-08-claude-minimax-handoff.md
CLAUDE.md
AGENTS.md
docs/devops/workflow-policy.md
```

## Development Workflow

All future work must use issue-driven development:

```text
issue/task -> branch -> commit -> validation -> PR -> review -> merge
```

Do not work directly on `master` for feature work. Branches must include the ticket or issue ID.

Examples:

```text
feature/12-artifact-audit
fix/18-missing-manifest-state
docs/24-cloudflare-runbook
build/31-cycles-ci-cache
agent/42-storage-panel
```

Upstream pushing is disabled locally. The HeyPuter remote is fetch-only:

```bash
git remote set-url --push origin DISABLED_UPSTREAM_PUSH
```

Push feature branches to the user fork remote.

## Local Setup

Install Node 22+ and pnpm.

```bash
node --version
pnpm --version
```

Install root dependencies:

```bash
pnpm install
```

Install demo dependencies:

```bash
cd demo
pnpm install
```

Run lightweight setup audit:

```bash
pnpm audit:setup
```

Run the demo app shell:

```bash
cd demo
pnpm dev
```

The demo requires built WASM artifacts for full behavior. If artifacts are absent, the app should show a clear unavailable/loading state, not fake success.

## Heavy Build Warning

The upstream build can compile a large Blender/Cycles dependency stack. It may take hours and many GB of RAM/disk. Do not run it casually on a workstation.

Do not run:

```bash
make all
make blender-web
ninja -j$(nproc)
```

until the build machine and resource budget are confirmed.

For local experiments, prefer:

```bash
BUILD_JOBS=2 make smoke
```

For real artifacts, use GitHub Actions or a self-hosted builder.

## Build Targets From Upstream

| Target | Meaning | Local Safety |
|---|---|---|
| `make smoke` | Small Emscripten/WebAssembly smoke test | Usually safe |
| `make mvp` | Toolchain, deps, Cycles web, render verification | Heavy |
| `make cycles-web` | Build and relink headless Cycles for browser | Heavy |
| `make configure-blender` | Configure full Blender | Very heavy |
| `make blender-web` | Link full Blender browser artifact | Very heavy |
| `make verify-render` | Playwright render verification | Needs render artifacts |

## Cloudflare Pages

The demo includes `demo/public/_headers` for cross-origin isolation headers needed by pthread WASM:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

Recommended deployment:

```text
App: Cloudflare Pages
Large artifacts: Cloudflare R2 or GitHub Releases
Production demo URL: add to GitHub repository About section
```

## Fork Remote Setup

This local clone keeps HeyPuter as `origin` for fetch only and disables pushing to it. Use the user fork remote for branches and PRs.

```bash
git remote -v
git remote set-url --push origin DISABLED_UPSTREAM_PUSH
git push backup HEAD:<branch-name>
```

Do not push to upstream.

## Definition Of Done

A task is complete only when:

1. implementation is done;
2. acceptance commands pass;
3. browser behavior is verified if user-visible behavior changed;
4. artifacts and sizes are recorded if artifacts changed;
5. docs/build notes are updated;
6. no fake Blender output is introduced;
7. git diff is scoped.
