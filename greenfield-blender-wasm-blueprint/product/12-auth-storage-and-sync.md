# 12 Auth, Storage, And Sync

## Principle

The app must work locally without an account. Auth adds sync, sharing, and cross-device continuity. It must not block the local render proof.

## User Modes

### Guest Local

Available immediately.

Capabilities:

- run render proof;
- cache artifacts;
- save local render outputs;
- store local projects in OPFS/IndexedDB;
- export files manually.

Limitations:

- no cross-device sync;
- no sharing;
- data tied to browser profile/device.

### Signed-In

Capabilities:

- sync project metadata;
- sync small settings;
- upload/download project files;
- share render outputs;
- use cloud render later;
- recover projects on another device.

## Auth Providers

Start with one provider.

Recommended options:

| Provider | Pros | Cons |
|---|---|---|
| Cloudflare Access / Workers auth | integrates with deployment stack | more custom implementation |
| Supabase Auth | fast product setup | external service dependency |
| Auth.js | flexible | more app/server wiring |
| GitHub OAuth only | simple for developer audience | poor for general users |

For a greenfield prototype, Supabase Auth or Cloudflare-based auth is acceptable. Choose once and document it in `docs/decisions/`.

## Local Storage Model

Use:

- IndexedDB for metadata;
- OPFS for large files;
- Cache Storage for versioned artifacts;
- localStorage only for tiny noncritical preferences.

Suggested schema:

```text
projects
  id
  name
  createdAt
  updatedAt
  localPath
  cloudId
  thumbnailPath
  syncState

renders
  id
  projectId
  createdAt
  engine
  artifactVersion
  imagePath
  width
  height
  elapsedMs

settings
  key
  value

artifactCache
  artifactName
  version
  manifest
  cachedAt
  bytes
```

## Cross-Device Sync

Do not sync huge files blindly.

Sync levels:

1. account profile;
2. settings;
3. project metadata;
4. render thumbnails;
5. selected render outputs;
6. selected project files;
7. full project folders later.

## Conflict Policy

Use simple conflict handling first:

- last writer wins for settings;
- manual duplicate for project conflicts;
- immutable render outputs never conflict;
- project file conflicts create copies.

## Cloud Storage Options

### Cloudflare R2

Best fit if deploying to Cloudflare.

Use for:

- render outputs;
- project files;
- artifact hosting;
- thumbnails.

### Supabase Storage

Good if using Supabase Auth.

Use for:

- simpler early auth/storage integration.

### GitHub Releases

Good for public runtime artifacts.

Not good for:

- user private project data.

## Privacy And Security

Minimum requirements:

- local projects remain local unless user signs in and enables sync;
- clear storage usage UI;
- delete local data button;
- delete cloud data button;
- no secret tokens in client source;
- server-side signed upload URLs for private cloud storage.

## Offline Sync Queue

Signed-in users should still be able to work offline.

Queue operations:

- create project;
- update metadata;
- create render output;
- upload selected file;
- delete project.

Each queued operation needs:

```text
id
type
createdAt
payload
retryCount
lastError
```

## Backup And Export

Always provide manual escape hatches:

- export render PNG;
- export project archive;
- export metadata JSON;
- import project archive.

