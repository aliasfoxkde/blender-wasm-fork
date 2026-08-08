# Blender Web Runtime: Greenfield Blueprint

Date: 2026-08-08
Status: planning blueprint
Recommended base: fork or adapt `https://github.com/HeyPuter/blender-wasm`

This folder is a complete starter blueprint for a new Blender-in-browser project. It is designed to be copied into a brand-new repository or used as the planning package for a fork of HeyPuter's Blender WASM work.

The prior project produced useful research, but the new project should not inherit its main architectural mistake: building a Blender-looking web app before producing real Blender-rendered output.

## Executive Summary

The project should pursue a render-first architecture:

```text
First:  real headless Cycles render in the browser.
Next:   real Blender command/runtime behavior in the browser.
Later:  full interactive Blender UI/WebGPU.
```

The first MVP is not "the full Blender desktop app in a browser tab." The first MVP is:

```text
A browser app downloads a real WASM render artifact, runs a real Blender-family render operation, and displays verified non-placeholder pixels.
```

## Why This Architecture

Full Blender in the browser is possible only after several hard systems are solved:

- real dependency sysroot;
- pinned Emscripten;
- Blender source patches or a known-good fork;
- host tool generation;
- browser-specific relink;
- pthreads and cross-origin isolation;
- WasmFS and asset mounting;
- large artifact packaging;
- browser rendering verification;
- later WebGPU/device handoff.

Trying to build the full editor first causes slow feedback, huge build failures, and a temptation to add fake viewport output. This blueprint avoids that by shipping proof in layers.

## Navigation

Read these documents in order.

| Document | Purpose |
|---|---|
| [`docs/00-project-charter.md`](docs/00-project-charter.md) | Product goal, MVP, non-goals, success criteria |
| [`architecture/01-system-architecture.md`](architecture/01-system-architecture.md) | Layered app/runtime/build architecture |
| [`architecture/02-build-architecture.md`](architecture/02-build-architecture.md) | Toolchain, dependency, host-tool, and browser relink strategy |
| [`architecture/03-runtime-architecture.md`](architecture/03-runtime-architecture.md) | TypeScript runtime adapter APIs and loading/render flow |
| [`plans/04-implementation-roadmap.md`](plans/04-implementation-roadmap.md) | Phase-by-phase implementation sequence |
| [`plans/05-build-optimization-plan.md`](plans/05-build-optimization-plan.md) | Build caching, artifact size, startup, and memory optimization |
| [`product/10-product-experience.md`](product/10-product-experience.md) | Starting page, app UX, mobile/tablet design, user workflows |
| [`product/11-web-performance-and-pwa.md`](product/11-web-performance-and-pwa.md) | Perceived performance, PWA/offline, caching, responsive behavior |
| [`product/12-auth-storage-and-sync.md`](product/12-auth-storage-and-sync.md) | Auth, local persistence, cross-device sync, cloud project model |
| [`deployment/13-cloudflare-pages.md`](deployment/13-cloudflare-pages.md) | Cloudflare Pages deployment, custom domain, GitHub demo link |
| [`plans/14-future-scope.md`](plans/14-future-scope.md) | Long-term product roadmap through full Blender/WebGPU |
| [`docs/15-greenfield-bootstrap-checklist.md`](docs/15-greenfield-bootstrap-checklist.md) | Exact checklist for creating the new repo or fork |
| [`architecture/16-data-and-api-contracts.md`](architecture/16-data-and-api-contracts.md) | Manifest, runtime, storage, sync, and worker API contracts |
| [`qa/17-testing-and-quality-strategy.md`](qa/17-testing-and-quality-strategy.md) | Unit, integration, browser, artifact, performance, and release testing |
| [`ops/18-observability-and-support.md`](ops/18-observability-and-support.md) | Logs, metrics, crash reports, support bundles, diagnostics |
| [`security/19-security-privacy-licensing.md`](security/19-security-privacy-licensing.md) | Threat model, privacy model, secrets, licenses, GPL obligations |
| [`product/20-design-system-and-accessibility.md`](product/20-design-system-and-accessibility.md) | Visual system, responsive layout, controls, accessibility |
| [`plans/21-agent-task-backlog.md`](plans/21-agent-task-backlog.md) | Small implementation tickets suitable for MiniMax-style agents |
| [`ci/06-ci-artifacts-release.md`](ci/06-ci-artifacts-release.md) | CI lanes, release artifacts, artifact manifest |
| [`agents/07-agent-handoff-rules.md`](agents/07-agent-handoff-rules.md) | Rules for MiniMax or other implementation agents |
| [`docs/08-risk-register.md`](docs/08-risk-register.md) | Risks and mitigations |
| [`docs/09-decision-log.md`](docs/09-decision-log.md) | Architecture decisions |

## Recommended Repo Layout

```text
new-project/
  README.md
  package.json
  pnpm-workspace.yaml
  app/
    src/
      components/
      routes/
      runtime/
      storage/
      auth/
      styles/
    tests/
  blender-build/
    Makefile
    cmake/
    scripts/
    patches/
    web/
  runtime/
    manifests/
    schemas/
  public/
    wasm/
      render/
      blender/
  artifacts/
    .gitkeep
  docs/
    decisions/
    build-notes/
    handoff/
  scripts/
    audit-artifacts.mjs
    fetch-artifacts.mjs
    package-render-artifacts.mjs
    verify-pixels.mjs
  tests/
    e2e/
  ops/
    diagnostics/
  security/
    threat-model.md
```

## Feature Vision

### MVP Features

- Render proof start page.
- Real WASM render artifact loading.
- Progress UI for artifact download, decompression, instantiate, render.
- One bundled sample scene.
- Render output display.
- Browser pixel verification.
- Local artifact cache.
- Clear unsupported/missing-artifact states.
- PWA install metadata.
- Cloudflare Pages deployment.

### Near-Term Features

- Multiple sample scenes.
- Local project library.
- OPFS persistence.
- Render history.
- Export PNG.
- Shareable render result link.
- Optional account sign-in.
- Cross-device project sync.
- Offline fallback for cached artifacts and recent projects.

### Long-Term Features

- Blender CLI runtime in browser.
- Scripted scene creation.
- `.blend` save/load proof.
- Full Blender runtime assets.
- WebGPU viewport.
- Editing workflows.
- AI assistant that operates on real project state.
- Cloud render queues for unsupported devices.
- Collaboration and comments.

## Disclaimers

This project is ambitious. The hard part is not making a web app look like Blender. The hard part is shipping real, verifiable Blender-family runtime behavior in browser constraints.

Do not claim:

- "Full Blender in browser" until full Blender runtime is actually running.
- "Viewport ready" until a real Blender-backed viewport renders pixels.
- ".blend support" until real load/save is verified.
- "Offline ready" until cached artifacts and projects work after a network cut.

## Getting Started: New Repo

1. Create or fork a repo.
2. Copy this blueprint into `docs/blueprint/`.
3. Create the app shell.
4. Create the artifact manifest validator.
5. Import or adapt the HeyPuter-style build harness.
6. Build the first smoke WASM.
7. Build Cycles render artifact on a real builder.
8. Integrate `CyclesRenderRuntime`.
9. Add Playwright pixel tests.
10. Deploy to Cloudflare Pages.

## Getting Started: HeyPuter Fork

1. Fork `https://github.com/HeyPuter/blender-wasm`.
2. Record the upstream commit SHA.
3. Add this blueprint under `docs/blueprint/`.
4. Keep the existing build harness separate from the product app until a render artifact is produced.
5. Add the product app around the artifact output.
6. Add artifact manifest and audit tooling.
7. Deploy the product app separately from heavy build output.

## Local Development Commands

Frontend-only:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright test
```

Heavy build commands must not be part of normal local development. If a local heavy command is unavoidable:

```bash
BUILD_JOBS=2 ./blender-build/scripts/build-cycles.sh
```

If Docker is introduced:

```bash
BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g ./scripts/build-with-docker.sh
```

## Deployment Target

Recommended initial deployment: Cloudflare Pages.

Why:

- simple GitHub integration;
- easy custom domain;
- useful preview deployments;
- straightforward static hosting;
- headers can be configured for SharedArrayBuffer/pthreads;
- gives GitHub repo a stable "Demo" link.

See [`deployment/13-cloudflare-pages.md`](deployment/13-cloudflare-pages.md).

## Non-Negotiable Rule

No placeholder graphics may be presented as Blender output. Every rendered pixel claimed as Blender output must come from a real WASM runtime path and be covered by browser tests.

## Definition Of Done

For any phase to be considered complete:

1. Code is implemented.
2. Acceptance commands pass.
3. Browser behavior is verified if user-visible behavior changed.
4. Artifact paths and sizes are recorded if artifacts changed.
5. Docs/build notes are updated.
6. No fake Blender output is introduced.
7. The git diff is scoped to the task.

