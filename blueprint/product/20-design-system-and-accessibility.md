# 20 Design System And Accessibility

## Design Direction

The app should feel like a precise creative/technical workstation, not a marketing landing page.

Tone:

- quiet;
- dense but readable;
- honest;
- tool-focused.

Avoid:

- fake 3D hero art;
- decorative placeholder viewport;
- oversized marketing sections;
- vague status text.

## Layout System

Desktop:

```text
Top command bar
Left navigation/project rail
Center work area
Right inspector/status panel
Bottom logs drawer
```

Tablet:

```text
Top command bar
Center work area
Slide-over inspector
Collapsible logs
```

Mobile:

```text
Top compact bar
Single-column task flow
Output preview
Primary action
Collapsed diagnostics
```

## Visual Tokens

Define tokens:

```text
color-bg
color-surface
color-surface-raised
color-border
color-text
color-text-muted
color-accent
color-success
color-warning
color-error

space-1 through space-8
radius-sm
radius-md
font-xs through font-2xl
shadow-panel
```

Keep card radius at 8px or less unless a platform style requires otherwise.

## Component Inventory

Required components:

```text
AppShell
TopBar
ProjectRail
RenderProofPanel
ArtifactStatus
RuntimeProgress
RuntimeLogDrawer
OutputPreview
DeviceSupportPanel
StorageUsagePanel
SettingsPanel
AuthButton
InstallPrompt
OfflineBanner
ErrorCallout
```

## Control Rules

Use:

- icon buttons for common tools;
- segmented controls for modes;
- toggles for binary settings;
- sliders/number inputs for numeric render settings;
- menus for option sets;
- tabs for panels;
- explicit buttons for destructive actions.

Do not use decorative button-like labels for status.

## Accessibility Requirements

Minimum:

- keyboard navigation;
- visible focus;
- sufficient contrast;
- `aria-live` for progress;
- status text not color-only;
- progress bars with labels;
- alt text for render outputs;
- logs readable by screen readers;
- reduced-motion support.

## Reduced Motion

If `prefers-reduced-motion`:

- disable decorative animations;
- keep progress updates text-based;
- avoid animated loading loops beyond simple spinner.

## Mobile Interaction

Touch targets:

```text
minimum 44px high
```

Avoid:

- hover-only tooltips;
- tiny inspector controls;
- wide tables;
- logs that permanently occupy the viewport.

## Error Design

Every error state needs:

```text
what happened
why it likely happened
what the user can do
technical details disclosure
copy diagnostics action
```

Example:

```text
Render artifact missing
The app loaded, but the render runtime files were not found at the configured artifact URL.
Check deployment artifacts or choose a different artifact source.
```

## Startup Page

The startup page is a tool surface:

- artifact state;
- device state;
- render proof action;
- recent outputs;
- diagnostics.

Do not build a landing page unless explicitly creating a public marketing route separate from the app.

