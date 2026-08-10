# Self-Hosted Builder Setup

**Status**: Infrastructure required

The `build-release.yml` workflow requires a heavy builder machine with:
- **44 GB disk** (for Blender source + dependency object trees)
- **31 GB RAM** (emscripten final link + wasm-opt spikes)
- **16 cores** (parallel builds)
- **~2 hour build time**

Standard GitHub-hosted runners (`ubuntu-latest`: 4 vCPU / 16 GB RAM) cannot complete this build.

---

## Option 1: Self-Hosted GitHub Runner (Recommended)

1. Provision a machine (e.g., AWS EC2 `m7i.4xlarge` or equivalent)
2. Install GitHub Actions runner: https://github.com/settings/actions/runners/new
3. Add labels: `self-hosted`, `builder`, `linux`
4. Update `.github/workflows/build-release.yml`:
   ```yaml
   jobs:
     build:
       runs-on: self-hosted  # instead of ubuntu-latest
   ```
5. Update `concurrency` to allow only one build at a time globally (not per-ref)

**Pros**: Full control, dedicated resources, no time limits
**Cons**: Requires machine provisioning and maintenance

---

## Option 2: Larger Cloud Compute

Use a cloud provider with predictable pricing:
- **AWS EC2**: `m7i.4xlarge` (16 vCPU, 64 GB RAM,~$0.80/hr on-demand)
- **Hetzner**: `@Server AMD NR` (16 cores, 64 GB RAM, ~€50/month)
- **Lambda Labs**: GPU cloud (has persistent instances)

**Pros**: Predictable costs, no physical hardware to manage
**Cons**: Still requires runner setup on the VM

---

## Option 3: Build Server (Dedicated)

Set up a persistent build server:
1. Install Gitea or similar for code hosting
2. Set up a dedicated CI/CD pipeline (Jenkins, Drone, Woodpecker)
3. Use a hook to trigger builds on tag push
4. Upload artifacts to R2 directly from the builder

**Pros**: Most flexible
**Cons**: Most complex

---

## Current Workflow Status

The workflow is **cancelled** on every tag because:
1. It runs on `ubuntu-latest` (too small → OOM or timeout)
2. `concurrency.cancel-in-progress: true` kills the previous run

The workflow code itself is correct — only the runner specification needs to change.

---

## Quick Fix for Testing

To test the workflow with the current small runner (will likely still OOM):

```bash
git tag v0.0.9-test-ci && git push origin v0.0.9-test-ci
```

Watch at: `https://github.com/aliasfoxkde/blender-wasm-fork/actions`

Even if it fails, the workflow logs will confirm which resource limit was hit first (disk / RAM / time).
