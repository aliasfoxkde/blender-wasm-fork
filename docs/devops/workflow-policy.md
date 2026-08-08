# DevOps Workflow Policy

Date: 2026-08-08

This repo requires issue-driven, branch-per-work development from this point forward.

## Remote Policy

`origin` is the user fork.

`upstream` is reserved for HeyPuter fetches.

Pushing to `upstream` must remain disabled:

```bash
git remote set-url --push upstream DISABLED_UPSTREAM_PUSH
```

The expected remote layout is:

```text
origin   https://github.com/aliasfoxkde/blender-wasm-fork.git
upstream https://github.com/HeyPuter/blender-wasm.git
```

Check before every push:

```bash
git remote -v
```

Do not push to HeyPuter upstream.

## Required Work Flow

Every change must follow:

```text
Issue/task -> branch -> implementation -> validation -> pull request -> review -> merge
```

No feature work directly on `master`.

## Issue Or Task Requirements

Every issue/task must include:

- problem statement;
- expected behavior;
- files or area likely involved;
- acceptance commands;
- stop conditions;
- whether heavy build is allowed;
- observability/logging expectations if runtime behavior changes.

## Branch Naming

Use one of:

```text
feature/<ticket-id>-short-name
fix/<ticket-id>-short-name
docs/<ticket-id>-short-name
build/<ticket-id>-short-name
agent/<ticket-id>-short-name
chore/<ticket-id>-short-name
```

Examples:

```text
feature/12-artifact-audit
fix/18-missing-manifest-state
docs/24-cloudflare-runbook
build/31-cycles-ci-cache
agent/42-storage-panel
```

If there is no issue number yet, create a task ID in the handoff doc:

```text
task-YYYYMMDD-short-name
```

## Pull Request Requirements

Every PR must include:

```md
## Problem

## Solution

## Commands Run

## Screenshots / Logs

## Artifacts

## Risks

## Rollback

Closes #<issue>
```

## Validation Gates

Fast validation:

```bash
pnpm audit:setup
cd demo
pnpm build
```

Artifact validation, once implemented:

```bash
pnpm audit:artifacts
```

Heavy validation must be manual or self-hosted:

```bash
make mvp
make cycles-web
make blender-web
```

Do not add heavy validation to normal PR CI.

## Pipeline Policy

Required lanes:

1. Fast PR CI:
   - setup audit;
   - demo build;
   - artifact audit when present.

2. Manual heavy build:
   - dependency build;
   - Cycles or Blender build;
   - artifact packaging;
   - render verification.

3. Deployment:
   - Cloudflare Pages preview;
   - production deploy only after PR merge.

## Observability Requirements

Any runtime-affecting PR must include:

- structured error code if adding failure behavior;
- logs in the runtime log panel;
- diagnostic field if applicable;
- support-bundle consideration for major runtime states.

## Agent Rules

MiniMax and other implementation agents must receive one ticket at a time.

The ticket must specify:

- allowed files;
- forbidden files;
- commands to run;
- acceptance criteria;
- stop conditions.

Claude Code or the owner reviews the result before merge.
