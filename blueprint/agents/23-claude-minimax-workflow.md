# 23 Claude And MiniMax Workflow

This document defines how to use Claude Code CLI and MiniMax-M2.7 together.

## Roles

### Claude Code

Use Claude for:

- architecture decisions;
- build failure triage;
- risky refactors;
- reviewing MiniMax output;
- final commits;
- CI/heavy build planning;
- security/licensing decisions.

### MiniMax-M2.7

Use MiniMax for:

- small isolated tickets;
- docs expansion;
- manifest validators;
- UI state components;
- tests;
- simple scripts;
- mechanical refactors after Claude defines the pattern.

## Work Packet Format

Every MiniMax task should be one packet:

```text
Task:
Files allowed:
Files forbidden:
Commands to run:
Acceptance criteria:
Stop conditions:
Output format:
```

Example:

```text
Task:
  Add scripts/audit-artifacts.mjs.

Files allowed:
  package.json
  scripts/audit-artifacts.mjs
  docs/build-notes/022-artifact-audit.md

Files forbidden:
  Makefile
  scripts/link_blender_release.sh
  demo/src/main.js

Commands to run:
  pnpm audit:artifacts
  pnpm audit:setup

Acceptance criteria:
  Missing artifacts print SKIP and exit 0.
  Manifest without required files exits 1.
  No heavy build command is run.

Stop conditions:
  Any need to build Blender.
```

## Review Checklist For MiniMax Output

Claude must check:

1. Did it touch only allowed files?
2. Did it run exactly the requested commands?
3. Did it create fake success states?
4. Did it add stubs?
5. Did it change heavy build scripts unnecessarily?
6. Did it update docs/build notes?
7. Is the git diff scoped?

## Branch Strategy

Recommended branches:

```text
master
  stable handoff baseline

agent/<ticket-id>
  MiniMax task branches

claude/<topic>
  Claude architecture or fix branches

build/<target>
  heavy build experiments
```

Do not let MiniMax stack many unrelated changes on `master`.

## Commit Rules

MiniMax commits should be small:

```text
docs: add heavy build readiness note
chore: add artifact audit script
test: cover missing artifact state
ui: show render artifact unavailable state
```

Bad commit messages:

```text
finish project
fix everything
full blender working
misc updates
```

## Heavy Build Failure Protocol

If a heavy build fails:

1. Stop.
2. Save the first failing error.
3. Save the command.
4. Save elapsed time.
5. Save machine resources.
6. Do not patch random dependencies.
7. Ask Claude to triage.

## Escalation Rules

Escalate from MiniMax to Claude when:

- CMake changes are needed;
- Emscripten flags change;
- Blender source patches are needed;
- artifact format changes;
- security/auth decisions are needed;
- tests require real browser pixel analysis;
- a build fails after more than one obvious local fix.

## Final Handoff Output

Each completed packet must end with:

```text
Files changed:
Commands run:
Results:
Artifacts:
Risks:
Next packet:
```

