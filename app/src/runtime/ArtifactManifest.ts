/**
 * ArtifactManifest
 *
 * Schema for the Blender WASM render artifact manifest.
 * This defines the contract between the build pipeline (which produces artifacts)
 * and the runtime adapter (which consumes them).
 *
 * Source of truth: blueprint/architecture/16-data-and-api-contracts.md
 */

export const MANIFEST_SCHEMA_VERSION = 1;

export const ARTIFACT_NAMES = ["cycles-render", "blender-cli", "blender-viewport"] as const;
export type ArtifactName = typeof ARTIFACT_NAMES[number];

export const RUNTIME_CAPABILITIES = [
  "headless-render",
  "filesystem",
  "pthreads",
  "python",
  "blend-load",
  "blend-save",
  "webgpu",
  "interactive-viewport",
] as const;
export type RuntimeCapability = typeof RUNTIME_CAPABILITIES[number];

export interface ArtifactManifest {
  schema: number;
  name: ArtifactName;
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

/** The set of artifact files required for any runtime. */
export const REQUIRED_ARTIFACT_PATHS = [
  "blender.js",
  "blender.wasm.zst",
  "assets.tar.zst",
  "manifest.json",
] as const;
