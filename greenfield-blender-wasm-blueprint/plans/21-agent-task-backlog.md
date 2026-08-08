# 21 Agent Task Backlog

This backlog breaks the project into small tasks suitable for MiniMax-M2.7 or another lower-cost agent.

## Track A: Repo Bootstrap

### A1: Create Root Files

Files:

```text
README.md
package.json
pnpm-workspace.yaml
.gitignore
.editorconfig
```

Acceptance:

```bash
pnpm install
```

### A2: Copy Blueprint

Files:

```text
docs/greenfield-blueprint/**
```

Acceptance:

- all blueprint links resolve.

### A3: App Scaffold

Files:

```text
app/
app/src/
app/tests/
```

Acceptance:

```bash
pnpm build
```

## Track B: Artifact System

### B1: Manifest Types

Files:

```text
app/src/runtime/ArtifactManifest.ts
```

Acceptance:

```bash
pnpm test
```

### B2: Manifest Validator

Files:

```text
app/src/runtime/validateArtifactManifest.ts
```

Acceptance:

- tests cover valid and invalid manifests.

### B3: Artifact Audit Script

Files:

```text
scripts/audit-artifacts.mjs
```

Acceptance:

```bash
pnpm audit:artifacts
```

## Track C: App UX

### C1: Render Proof Page

Files:

```text
app/src/routes/RenderProofPage.tsx
app/src/components/RenderProofPanel.tsx
```

Acceptance:

- missing-artifact state visible;
- no fake render output.

### C2: Runtime Progress Component

Files:

```text
app/src/components/RuntimeProgress.tsx
```

Acceptance:

- states render correctly in tests.

### C3: Diagnostics Drawer

Files:

```text
app/src/components/DiagnosticsDrawer.tsx
```

Acceptance:

- browser capability fields shown.

## Track D: Runtime

### D1: Runtime State Machine

Files:

```text
app/src/runtime/runtimeState.ts
```

Acceptance:

- invalid state transitions rejected.

### D2: CyclesRenderRuntime Skeleton

Files:

```text
app/src/runtime/CyclesRenderRuntime.ts
```

Acceptance:

- loads manifest;
- reports missing artifact clearly;
- no fake render success.

### D3: Render Result Handling

Files:

```text
app/src/runtime/renderResult.ts
```

Acceptance:

- image Blob URL generated only from returned bytes.

## Track E: Build Harness

### E1: Toolchain Setup

Files:

```text
blender-build/scripts/setup-toolchain.sh
```

Acceptance:

```bash
bash -n blender-build/scripts/setup-toolchain.sh
```

### E2: Blender Fetch

Files:

```text
blender-build/scripts/fetch-blender.sh
```

Acceptance:

```bash
bash -n blender-build/scripts/fetch-blender.sh
```

### E3: Cycles CMake Cache

Files:

```text
blender-build/cmake/cycles-wasm-cache.cmake
```

Acceptance:

- contains required cache flags.

## Track F: CI And Deployment

### F1: PR CI

Files:

```text
.github/workflows/ci.yml
```

Acceptance:

- no heavy build commands in PR CI.

### F2: Cloudflare Headers

Files:

```text
public/_headers
```

Acceptance:

- required COOP/COEP headers present.

### F3: Deploy Smoke Test

Files:

```text
tests/e2e/deployed-smoke.spec.ts
```

Acceptance:

```bash
BASE_URL=http://localhost:4173 pnpm exec playwright test tests/e2e/deployed-smoke.spec.ts
```

## Track G: Persistence

### G1: Local DB Schema

Files:

```text
app/src/storage/schema.ts
```

Acceptance:

- migration tests pass.

### G2: Render History

Files:

```text
app/src/storage/renderHistory.ts
```

Acceptance:

- create/list/delete tests pass.

### G3: Storage Cleanup UI

Files:

```text
app/src/components/StorageUsagePanel.tsx
```

Acceptance:

- user can clear artifact cache and render history separately.

## Track H: Auth And Sync

Do not start until local storage works.

### H1: Auth Provider Decision

Files:

```text
docs/decisions/auth-provider.md
```

Acceptance:

- provider selected with tradeoffs.

### H2: Sign-In UI

Files:

```text
app/src/auth/
app/src/components/AuthButton.tsx
```

Acceptance:

- guest mode still works.

### H3: Sync Queue

Files:

```text
app/src/sync/syncQueue.ts
```

Acceptance:

- offline queue tests pass.

