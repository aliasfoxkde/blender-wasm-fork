# Claude Code Instructions

You are working in a fork of `https://github.com/HeyPuter/blender-wasm`.

Primary objective: turn this fork into a product-grade browser Blender runtime project using the blueprint in `blueprint/`.

## Read First

Before editing code, read:

1. `README.md`
2. `AGENTS.md`
3. `docs/handoff/2026-08-08-claude-minimax-handoff.md`
4. `blueprint/README.md`
5. `blueprint/plans/21-agent-task-backlog.md`
6. `blueprint/plans/22-first-week-execution-plan.md`
7. `blueprint/agents/23-claude-minimax-workflow.md`
8. `docs/devops/workflow-policy.md`

## Non-Negotiable Rules

1. Do not present fake WebGL/Canvas/Three.js graphics as Blender output.
2. Do not create dependency stubs and mark features complete.
3. Do not run heavy build targets locally unless explicitly approved.
4. Do not run unbounded `ninja -j$(nproc)` for Blender-scale targets.
5. Do not push to HeyPuter upstream.
6. Keep upstream build harness changes small and documented.
7. Prefer product work around artifact manifests/runtime adapters before changing full Blender build internals.
8. Require an issue/task, feature branch, and PR for every new unit of work.

## Safe Local Commands

```bash
git status --short --branch
pnpm audit:setup
cd demo && pnpm install
cd demo && pnpm build
```

## Heavy Commands

Treat these as CI/self-hosted-builder commands:

```bash
make mvp
make cycles-web
make configure-blender
make blender-web
```

If asked to run one locally, confirm resource constraints and use limited jobs where supported.

## First Implementation Sequence

Start with small, low-risk tasks:

1. Verify fork remote setup.
2. Create or identify the issue/task.
3. Create a feature branch tied to the issue/task.
4. Keep blueprint docs current.
5. Add artifact manifest audit tooling.
6. Add product app shell states.
7. Add missing-artifact tests.
8. Only then work on build artifact integration.

## Reporting Format

Every handoff response should include:

```text
Files changed:
Commands run:
Results:
Artifacts:
Known limitations:
Next step:
```
