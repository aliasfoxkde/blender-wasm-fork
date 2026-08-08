# 08 Risk Register

## R1: Fake Output Mistaken For Blender

Risk: app shows placeholder graphics and everyone believes Blender rendering works.

Mitigation:

- no fake canvas;
- pixel tests;
- explicit UI language;
- render output must come from WASM filesystem.

## R2: Local Machine Resource Exhaustion

Risk: Docker/Ninja freezes workstation.

Mitigation:

- no heavy builds by default;
- `BUILD_JOBS=2`;
- use CI/self-hosted builder;
- record resource use in build notes.

## R3: Dependency Build Spiral

Risk: building full dependency stack consumes weeks.

Mitigation:

- headless Cycles first;
- disable unused features;
- add dependencies only when required;
- cache sysroot.

## R4: Artifact Too Large

Risk: browser startup is unusable.

Mitigation:

- zstd compression;
- asset trimming;
- manifest sizes;
- progress UI;
- cache artifacts.

## R5: Browser Pthreads Unsupported

Risk: SharedArrayBuffer unavailable because headers are missing.

Mitigation:

- dev/preview/prod COOP/COEP headers;
- explicit unsupported state;
- e2e header test.

## R6: Full Blender UI Takes Over Too Early

Risk: project jumps to WebGPU/UI before render proof.

Mitigation:

- entry criteria for full Blender;
- phase gate;
- no viewport claims before pixel proof.

## R7: Fork Drift

Risk: copied HeyPuter strategy becomes stale or untraceable.

Mitigation:

- record upstream commit SHA;
- preserve patches separately;
- document every deviation.

