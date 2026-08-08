# 10 Product Experience

## Product Positioning

The product should feel like a serious browser-based creative runtime, not a marketing page and not a fake Blender skin.

Initial promise:

```text
Run a real Blender-family render proof in your browser.
```

Later promise:

```text
Open, render, and edit Blender projects from any modern browser.
```

## Starting Page

The first screen should be the working product surface, not a landing page.

Recommended first screen layout:

```text
Top bar
  Project name
  Artifact status
  Sign in / profile
  Settings

Main work area
  Render Proof panel
  Output preview
  Runtime log

Side panel
  Sample scene selector
  Artifact details
  Device support
  Recent renders
```

## First-Run Flow

1. Detect browser capabilities.
2. Show runtime requirements:

   - WebAssembly;
   - SharedArrayBuffer support if pthread artifact is selected;
   - storage availability;
   - WebGPU later.

3. Fetch artifact manifest.
4. Show artifact version and size before download.
5. Download with progress.
6. Instantiate runtime.
7. Enable `Render sample scene`.
8. Display output and logs.

## Empty States

Use explicit empty states.

Good:

```text
Render artifact not installed.
Download the verified render artifact to run the sample scene.
```

Bad:

```text
Grey viewport with no explanation.
```

## Mobile And Tablet Experience

Mobile will not be the best place for full Blender editing, but it can still provide useful workflows.

### Mobile MVP

- View render proof.
- Review recent render outputs.
- Download/export images.
- Inspect project metadata.
- Start cloud render later.
- Open shared links.
- Manage account/storage.

### Tablet MVP

- Run render proof.
- Choose sample scenes.
- Adjust simple scene parameters.
- Use touch-friendly orbit/pan for later viewport preview.
- Manage local/cloud projects.

### Mobile Design Rules

1. Use a single-column layout below tablet width.
2. Keep logs collapsible.
3. Keep render controls sticky near bottom.
4. Use large tap targets.
5. Avoid hover-only controls.
6. Avoid giant asset downloads without clear confirmation.
7. Persist partially downloaded/cached artifact state where possible.

## Desktop Experience

Desktop should prioritize a dense, useful workspace:

- left project/library panel;
- center render/output area;
- right runtime/device/properties panel;
- bottom logs/progress drawer;
- top command bar.

Avoid decorative cards inside cards. Use compact panels and clear status labels.

## Key UX States

### Artifact Missing

Show:

- artifact name;
- expected version;
- how to fetch/build;
- whether browser can run it;
- link to release artifact if configured.

### Artifact Downloading

Show:

- downloaded bytes;
- total bytes;
- transfer speed;
- estimated remaining time;
- current phase.

### Runtime Ready

Show:

- source ref;
- Emscripten version;
- runtime mode;
- memory estimate;
- render button.

### Rendering

Show:

- elapsed time;
- logs;
- cancel button if supported;
- current output file path if known.

### Render Complete

Show:

- image;
- dimensions;
- render time;
- export button;
- copy/share link if cloud storage exists.

## Accessibility

Minimum requirements:

- keyboard-operable controls;
- visible focus state;
- no color-only status indicators;
- logs readable by screen readers;
- progress bars with text equivalents;
- images have meaningful alt text.

## Copy Rules

Use precise labels:

- `Headless Cycles render proof`
- `Blender runtime artifact`
- `Browser render output`
- `Full Blender UI not available in this build`

Avoid vague labels:

- `Blender ready`
- `Real viewport`
- `Production Blender`
- `Full editor`

