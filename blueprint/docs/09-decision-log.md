# 09 Decision Log

## D1: Restart From A Greenfield Architecture

Decision: treat the previous repo as research, not the production architecture.

Reason:

- it proved useful technical facts;
- it did not provide a fast path to real browser-visible Blender output.

## D2: Use Render-First MVP

Decision: first real milestone is headless Cycles/browser render.

Reason:

- objective output;
- easier verification;
- avoids full UI/WebGPU complexity;
- still real Blender-family rendering.

## D3: Use HeyPuter-Style Build Strategy

Decision: use or fork HeyPuter's method as the main build baseline.

Reason:

- pinned toolchain;
- real dependency sysroot;
- browser relink;
- artifact packaging;
- explicit heavy-build awareness.

## D4: Keep Product Shell Separate

Decision: web app and Blender build harness remain separate layers.

Reason:

- frontend can iterate quickly;
- heavy builds can run elsewhere;
- artifacts become clear boundaries.

## D5: No Fake Viewport

Decision: no placeholder viewport output in MVP.

Reason:

- previous placeholder work caused incorrect status claims;
- pixel verification must prove real runtime behavior.

