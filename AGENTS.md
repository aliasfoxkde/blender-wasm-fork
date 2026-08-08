# Agent Instructions

This repo uses a HeyPuter Blender WASM fork plus a greenfield product blueprint.

## Mission

Build toward a real browser Blender runtime. The first honest milestone is a browser-visible render produced by real WASM runtime code.

## DevOps Workflow

Every unit of work requires an issue, ticket, or task before implementation.

Required flow:

```text
issue/task -> feature branch -> implementation -> validation -> pull request -> review -> merge
```

Branch naming:

```text
feature/<ticket-id>-short-name
fix/<ticket-id>-short-name
docs/<ticket-id>-short-name
build/<ticket-id>-short-name
agent/<ticket-id>-short-name
```

Do not work directly on `master` except for emergency documentation/handoff commits explicitly requested by the owner.

Every PR must reference its issue/task and include:

- problem;
- solution;
- commands run;
- screenshots or logs if UI/build behavior changed;
- artifact sizes if artifacts changed;
- risks and rollback.

Upstream pushing is disabled. `origin` is the user fork. `upstream` is HeyPuter fetch-only and its push URL must stay set to `DISABLED_UPSTREAM_PUSH`.

## Do Not Do This

- Do not add a fake viewport.
- Do not call static images, CSS, Canvas, WebGL, or Three.js output "Blender rendering".
- Do not run heavy Blender builds on the user's machine without explicit approval.
- Do not mark a phase complete unless acceptance commands pass.
- Do not commit generated dependency/build trees.

## Safe Discovery

Use:

```bash
git status --short --branch
find . -maxdepth 3 -type f | sort
rg "pattern"
```

Avoid scanning huge generated directories if present:

```text
emsdk/
deps/
wasm-sysroot/
build-cycles/
build-blender/
demo/dist/
node_modules/
```

## Build Safety

Normal PR checks must not build Blender.

Heavy build targets belong in CI or a self-hosted runner with explicit CPU/RAM/swap/disk budget.

## Required Docs

Keep these current:

```text
README.md
CLAUDE.md
docs/devops/
docs/handoff/
blueprint/
```
