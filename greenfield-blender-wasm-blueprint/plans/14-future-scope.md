# 14 Future Scope

This document captures the long-term roadmap after the first real render MVP.

## Scope Ladder

### Level 0: Research Baseline

What exists:

- docs;
- app shell;
- artifact manifest audit;
- no real render yet.

Exit criteria:

- smoke WASM loads in browser.

### Level 1: Real Render Proof

Features:

- headless Cycles WASM;
- sample scene;
- browser output image;
- pixel tests;
- artifact manifest.

Exit criteria:

- render proof passes in deployed environment.

### Level 2: Useful Render Tool

Features:

- multiple sample scenes;
- editable simple parameters;
- render history;
- PNG export;
- device warnings;
- local persistence.

Exit criteria:

- user can create a small render output and return later on same device.

### Level 3: Account And Sync

Features:

- sign in;
- cloud metadata;
- selected file sync;
- cross-device render history;
- shared render links.

Exit criteria:

- user can start on one machine and view synced project metadata/output on another.

### Level 4: Blender CLI Runtime

Features:

- full Blender command runtime;
- Python runtime;
- Blender scripts/datafiles;
- script execution;
- `.blend` save proof;
- simple `.blend` load proof.

Exit criteria:

- browser runs a real Blender Python script and produces a verifiable `.blend` or image.

### Level 5: Browser Project Workspace

Features:

- local project folders;
- import/export archive;
- thumbnails;
- project versions;
- render queue;
- OPFS storage manager.

Exit criteria:

- user can manage multiple browser-local Blender projects.

### Level 6: Interactive Viewport

Features:

- WebGPU backend;
- OffscreenCanvas;
- real Blender viewport pixels;
- camera orbit;
- object selection;
- basic transforms.

Exit criteria:

- pixel/screenshot tests prove real viewport output and object interaction.

### Level 7: Editing MVP

Features:

- add/delete primitives;
- transform tools;
- material edits;
- save/load;
- import one asset format;
- render final image.

Exit criteria:

- user can complete a simple edit-render-save workflow.

### Level 8: AI-Assisted Workflows

Features:

- prompt-to-scene operations;
- explain scene;
- optimize render settings;
- generate scripts;
- validate changes before applying;
- operate on real Blender runtime state.

Exit criteria:

- AI modifies real project state and changes are visible in render/viewport tests.

### Level 9: Collaboration

Features:

- shared project links;
- comments;
- render review;
- version snapshots;
- team storage.

Exit criteria:

- two users can review the same render/project state across accounts.

## Feature Backlog

### Rendering

- sample scenes;
- material presets;
- render quality slider;
- denoise options;
- render queue;
- cloud fallback render;
- image comparison.

### Project Management

- recent projects;
- local project archive;
- cloud sync;
- thumbnails;
- tags;
- search.

### Runtime

- artifact version selector;
- artifact rollback;
- device-specific artifacts;
- debug artifact mode;
- crash reporting.

### Editing

- object hierarchy;
- transform gizmos;
- material editor;
- camera controls;
- lighting controls;
- import/export.

### Mobile

- render viewer;
- project browser;
- share/export;
- cloud render launch;
- comments/review;
- simple parameter controls.

### PWA

- offline app shell;
- cached runtime;
- cached recent projects;
- install prompt;
- update available banner;
- storage cleanup.

### Deployment

- Cloudflare Pages production;
- preview deployments;
- R2 artifact hosting;
- custom domain;
- GitHub demo link;
- release automation.

## Deferral Rules

Defer a feature if:

- it requires fake output;
- it requires full Blender UI before render proof;
- it cannot be browser-tested;
- it hides runtime failure;
- it causes huge artifacts before useful output exists.

## Graduation Criteria

The project graduates from experimental to alpha when:

1. real render MVP works on production URL;
2. artifacts are versioned and auditable;
3. local persistence works;
4. PWA install works;
5. auth/sync path is designed or implemented;
6. full limitations are documented.

