# 19 Security, Privacy, And Licensing

## Security Model

The app runs large native-derived code in the browser. Treat the WASM runtime and user files as sensitive boundaries.

Primary assets:

- user project files;
- render outputs;
- auth/session state;
- cloud storage credentials;
- runtime artifacts;
- artifact manifests.

## Threats

### Malicious Artifact

Risk: attacker swaps WASM artifact.

Mitigation:

- versioned artifact paths;
- SHA-256 in manifest;
- HTTPS only;
- optional signed manifest later;
- audit script verifies hashes.

### Malicious Project File

Risk: malformed `.blend` or asset exploits runtime bug.

Mitigation:

- local-first sandboxed browser runtime;
- no automatic cloud sharing;
- file size limits;
- clear crash recovery;
- future fuzzing for import paths.

### Token Leakage

Risk: logs or support bundle include auth tokens.

Mitigation:

- never log tokens;
- redact URL query params;
- use short-lived signed upload URLs;
- support bundle denylist.

### Cross-Origin Isolation Breakage

Risk: third-party assets break pthread runtime or reduce isolation.

Mitigation:

- self-host critical assets;
- strict `_headers`;
- deployment tests.

## Privacy Model

Default mode is local-only.

User data should not leave the device unless:

1. user signs in;
2. user enables sync or uploads;
3. user exports/shares manually.

## Data Classification

```text
Public:
  app bundle
  public runtime artifacts
  public sample scenes

Local private:
  project files
  render outputs
  local settings
  diagnostics

Cloud private:
  synced projects
  user render outputs
  account profile

Sensitive:
  auth tokens
  signed URLs
  private storage keys
```

## Auth Security

Rules:

- no long-lived secrets in browser source;
- use OAuth/OIDC or managed auth;
- prefer HTTP-only cookies if server architecture allows;
- otherwise use short-lived access tokens and refresh flow;
- logout clears local auth state but not local projects unless user asks.

## Storage Security

Local:

- use browser storage;
- do not attempt custom encryption until key management is designed;
- provide delete data UI.

Cloud:

- private buckets by default;
- signed upload/download URLs;
- per-user authorization checks;
- no public project files unless explicitly shared.

## Licensing

Blender is GPL. A Blender-derived WASM distribution has serious license obligations.

Minimum actions:

1. Preserve Blender license notices.
2. Publish corresponding source or exact source retrieval instructions.
3. Record Blender source remote/ref.
4. Record patches.
5. Include dependency licenses.
6. Include artifact build info.
7. Do not imply Blender Foundation endorsement.

## Third-Party Dependency Notices

Every release artifact bundle should include:

```text
LICENSES/
BUILD-INFO.txt
SOURCE-REFS.txt
```

`SOURCE-REFS.txt`:

```text
Blender remote:
Blender ref:
Emscripten version:
Dependency names and versions:
Patch files:
```

## AI Feature Safety

Future AI assistant must:

- operate on real project state;
- preview changes before applying destructive edits;
- ask before deleting objects/files;
- keep audit log of AI actions;
- avoid uploading private project context unless user enables cloud AI.

## Security Checklist Before Public Alpha

1. Artifact hash validation.
2. License bundle.
3. Privacy statement.
4. Local data deletion UI.
5. Auth logout tested.
6. Cloud storage authorization tested.
7. Support bundle redaction tested.
8. Deployment headers verified.

