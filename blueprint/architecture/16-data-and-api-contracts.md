# 16 Data And API Contracts

These contracts define boundaries between the app, runtime adapters, workers, local storage, cloud sync, and artifact build pipeline.

## Artifact Manifest Contract

File:

```text
public/wasm/render/manifest.json
```

Schema:

```ts
export interface ArtifactManifest {
  schema: 1;
  name: 'cycles-render' | 'blender-cli' | 'blender-viewport';
  version: string;
  createdAt: string;
  source: {
    remote: string;
    ref: string;
    patchSet?: string;
  };
  toolchain: {
    emscripten: string;
    node?: string;
    cmake?: string;
    ninja?: string;
  };
  capabilities: RuntimeCapability[];
  requirements: RuntimeRequirements;
  artifacts: Record<string, ArtifactFile>;
}

export type RuntimeCapability =
  | 'headless-render'
  | 'filesystem'
  | 'pthreads'
  | 'python'
  | 'blend-load'
  | 'blend-save'
  | 'webgpu'
  | 'interactive-viewport';

export interface RuntimeRequirements {
  crossOriginIsolated?: boolean;
  sharedArrayBuffer?: boolean;
  webgpu?: boolean;
  minimumMemoryMb?: number;
  estimatedStorageMb?: number;
}

export interface ArtifactFile {
  path: string;
  mediaType: string;
  bytes?: number;
  compressedBytes?: number;
  decompressedBytes?: number;
  sha256?: string;
}
```

Validation rules:

1. `schema` must equal `1`.
2. `version` must be semver-like.
3. `source.ref` must be present.
4. Every artifact path must be relative.
5. Every declared artifact must exist.
6. Byte counts must match when present.
7. SHA-256 must match when present.

## Runtime Adapter Contract

All runtime adapters must follow this shape:

```ts
export interface RuntimeAdapter<TManifest, TResult> {
  load(): Promise<void>;
  isLoaded(): boolean;
  getManifest(): TManifest | null;
  onProgress(callback: (progress: RuntimeProgress) => void): () => void;
  dispose(): void;
}
```

Render adapter extends it:

```ts
export interface RenderRuntimeAdapter extends RuntimeAdapter<ArtifactManifest, RenderResult> {
  renderSampleScene(options?: RenderOptions): Promise<RenderResult>;
}
```

## Render Options

```ts
export interface RenderOptions {
  sceneId?: string;
  width?: number;
  height?: number;
  samples?: number;
  timeoutMs?: number;
}
```

Defaults:

```text
sceneId: bundled-smoke
width: 512
height: 512
samples: 16
timeoutMs: 120000
```

## Render Result

```ts
export interface RenderResult {
  success: boolean;
  id: string;
  imageUrl?: string;
  imageBytes?: Uint8Array;
  width?: number;
  height?: number;
  elapsedMs?: number;
  artifactVersion?: string;
  logs: RuntimeLogLine[];
  error?: RuntimeError;
}
```

## Runtime Error

```ts
export interface RuntimeError {
  code:
    | 'ARTIFACT_MISSING'
    | 'MANIFEST_INVALID'
    | 'UNSUPPORTED_BROWSER'
    | 'DOWNLOAD_FAILED'
    | 'DECOMPRESSION_FAILED'
    | 'INSTANTIATE_FAILED'
    | 'RENDER_FAILED'
    | 'OUTPUT_MISSING'
    | 'TIMEOUT'
    | 'OUT_OF_MEMORY'
    | 'UNKNOWN';
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}
```

## Runtime Logs

```ts
export interface RuntimeLogLine {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: 'app' | 'runtime' | 'wasm' | 'worker' | 'service-worker';
  message: string;
}
```

Log rules:

- cap UI logs to a fixed number;
- preserve full logs in support bundle;
- do not log auth tokens;
- do not log private file contents.

## Local Project Model

```ts
export interface LocalProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  localRootHandleId?: string;
  cloudId?: string;
  syncState: 'local-only' | 'synced' | 'dirty' | 'conflict' | 'sync-error';
  thumbnailRenderId?: string;
  tags: string[];
}
```

## Render History Model

```ts
export interface RenderHistoryItem {
  id: string;
  projectId?: string;
  sceneId: string;
  createdAt: string;
  artifactName: string;
  artifactVersion: string;
  imagePath: string;
  width: number;
  height: number;
  elapsedMs: number;
  localOnly: boolean;
  cloudUrl?: string;
}
```

## Sync Contract

Sync operations:

```ts
export type SyncOperationType =
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'render.upload'
  | 'render.delete'
  | 'settings.update';
```

Queue item:

```ts
export interface SyncQueueItem {
  id: string;
  type: SyncOperationType;
  createdAt: string;
  updatedAt: string;
  payload: unknown;
  retryCount: number;
  lastError?: string;
}
```

## Worker Message Contract

Use workers for decompression and later heavy non-WASM tasks.

```ts
export type WorkerRequest =
  | { id: string; type: 'decompress.zstd'; bytes: ArrayBuffer; expectedBytes?: number }
  | { id: string; type: 'sha256'; bytes: ArrayBuffer };

export type WorkerResponse =
  | { id: string; type: 'success'; result: unknown }
  | { id: string; type: 'error'; error: RuntimeError };
```

## API Versioning

Version every boundary:

- artifact manifest schema;
- runtime adapter API;
- cloud API;
- local database schema.

Breaking changes require:

1. migration or explicit reset path;
2. changelog entry;
3. test coverage.

