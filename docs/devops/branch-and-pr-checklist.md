# Branch And PR Checklist

Use this before starting any work.

## Start Work

```bash
git status --short --branch
git remote -v
git fetch backup
git checkout master
git pull --ff-only backup heyputer-fork-blueprint || true
git checkout -b <type>/<ticket-id>-short-name
```

## Before Commit

```bash
pnpm audit:setup
cd demo
pnpm build
```

Check:

- no generated build trees;
- no node_modules;
- no fake render output;
- docs updated.

## Push Branch

```bash
git push -u backup HEAD
```

## Open PR

Use `.github/PULL_REQUEST_TEMPLATE.md`.

The PR must reference its issue/task.

