# 03 Runtime Architecture

## Runtime Adapters

Create one adapter per WASM capability.

```text
CyclesRenderRuntime
  First MVP. Runs headless render and returns image output.

BlenderCliRuntime
  Later. Runs full Blender command/script behavior.

BlenderViewportRuntime
  Later. Owns real interactive viewport integration.
```

Do not create one giant `BlenderRuntime` until the module capabilities are stable.

## CyclesRenderRuntime API

```ts
export interface RenderManifest {
  schema: 1;
  name: 'cycles-render';
  version: string;
  sourceRemote: string;
  sourceRef: string;
  emscripten: string;
  artifacts: {
    js: ArtifactInfo;
    wasm: ArtifactInfo;
    data?: ArtifactInfo;
    assets?: ArtifactInfo;
  };
}

export interface ArtifactInfo {
  path: string;
  bytes?: number;
  compressedBytes?: number;
  decompressedBytes?: number;
  sha256?: string;
}

export interface RuntimeProgress {
  phase:
    | 'idle'
    | 'manifest'
    | 'download'
    | 'decompress'
    | 'instantiate'
    | 'ready'
    | 'render'
    | 'complete'
    | 'error';
  message: string;
  loadedBytes?: number;
  totalBytes?: number;
}

export interface RenderResult {
  success: boolean;
  imageUrl?: string;
  imageBytes?: Uint8Array;
  width?: number;
  height?: number;
  elapsedMs?: number;
  logs: string[];
  error?: string;
}

export class CyclesRenderRuntime {
  constructor(options?: { baseUrl?: string });
  onProgress(callback: (progress: RuntimeProgress) => void): () => void;
  load(): Promise<void>;
  isLoaded(): boolean;
  renderSampleScene(): Promise<RenderResult>;
  dispose(): void;
}
```

## Loading Flow

1. Fetch manifest.
2. Validate schema.
3. Fetch JS glue.
4. Fetch WASM or compressed WASM.
5. Decompress if needed.
6. Instantiate module.
7. Mount preloaded data/assets.
8. Mark ready.

## Render Flow

1. Ensure runtime is ready.
2. Clear prior output file.
3. Call the render entry point.
4. Read output from WasmFS.
5. Validate nonzero output bytes.
6. Create Blob URL.
7. Return result object.

## Error Handling

Errors must be actionable.

Bad:

```text
Render failed
```

Good:

```text
Render failed because /out/render.png was not produced by the WASM filesystem.
```

## UI Requirements

Render proof UI must show:

- runtime state;
- artifact version;
- source ref;
- download progress;
- render button;
- logs;
- output image;
- explicit limitation text.

It must not show:

- fake viewport;
- decorative 3D cube;
- static bundled output pretending to be generated;
- "full Blender ready" wording.

