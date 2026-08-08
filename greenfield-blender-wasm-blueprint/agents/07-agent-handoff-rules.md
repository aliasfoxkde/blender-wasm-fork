# 07 Agent Handoff Rules

Use this file as the prompt appendix for MiniMax-M2.7 or any lower-cost implementation agent.

## Primary Instruction

Implement the project one phase at a time. Do not skip phases. Do not claim completion without running the acceptance commands.

## Forbidden Behavior

Do not:

- create fake Blender render output;
- create placeholder dependencies and call them complete;
- run unbounded Docker/Ninja builds;
- change frontend copy to hide missing runtime behavior;
- commit huge artifacts without artifact-policy approval;
- start full Blender UI before render proof works;
- edit unrelated files to make tests pass.

## Required Turn Output

For each task, report:

```text
Files changed:
Commands run:
Result:
Artifact paths:
Known limitations:
Next step:
```

## Required Build Failure Report

If a build fails, report:

```text
Command:
Elapsed time:
First failing compiler/linker error:
Target being built:
Likely cause:
Recommended fix:
Files changed during failed attempt:
```

Do not continue changing unrelated files after a compiler/linker failure.

## Phase Discipline

Phase is complete only when:

1. implementation is done;
2. acceptance commands pass;
3. docs/build note is written;
4. no fake output was introduced;
5. git diff is scoped.

## Local Resource Limits

For any heavy local build:

```bash
BUILD_JOBS=2
```

If Docker is used:

```bash
BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g
```

## Preferred First Implementation

Start with:

```text
plans/04-implementation-roadmap.md Phase 0
plans/04-implementation-roadmap.md Phase 1
plans/04-implementation-roadmap.md Phase 2
```

Do not start Cycles build work until the app shell and artifact manifest audit exist.

