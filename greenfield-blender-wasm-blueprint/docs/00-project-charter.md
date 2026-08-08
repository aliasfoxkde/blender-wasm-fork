# 00 Project Charter

## Goal

Build a browser application that runs real Blender-family code through WebAssembly and eventually supports a real interactive Blender experience.

The first product milestone is not full Blender. The first product milestone is:

```text
A browser-visible render result produced by real WASM-rendering code derived from Blender/Cycles.
```

## Why Restart

The previous repo proved useful facts:

- Emscripten can compile some Blender source libraries.
- Native host tools can unblock `makesdna` enough for `bf_dna` and `bf_blenlib`.
- The web app can load WASM modules and run smoke tests.
- Fake viewport work creates confusion and wastes effort.
- Local Docker can overload the workstation.

Those are valid lessons, but the architecture was moving too slowly toward real user-visible Blender behavior.

## Product Vision

Final user experience:

1. User opens the web app.
2. App downloads/caches verified Blender WASM artifacts.
3. User can open/create a project.
4. Browser runs real Blender runtime behavior.
5. User sees real rendered output.
6. Later, user interacts with a real Blender-backed viewport and editing surface.

## MVP

MVP means:

- real WASM render module;
- bundled tiny scene;
- render command;
- browser-visible image output;
- Playwright pixel verification;
- artifact manifest;
- no fake canvas;
- no claims of full Blender UI.

## Non-Goals For MVP

- Full Blender desktop UI.
- General `.blend` compatibility.
- Addon support.
- Python scripting in the first render proof.
- WebGPU viewport.
- Multi-file project persistence.
- Cloud collaboration.
- AI editing.

## Success Criteria

The MVP is successful only when:

```bash
pnpm test
pnpm build
pnpm exec playwright test
```

passes and the e2e test verifies non-placeholder pixels produced by the WASM render module.

