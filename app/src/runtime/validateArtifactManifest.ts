/**
 * validateArtifactManifest
 *
 * Validates an artifact manifest object (not a file).
 * Use auditArtifacts() to validate files on disk.
 */
import { MANIFEST_SCHEMA_VERSION, ARTIFACT_NAMES, RUNTIME_CAPABILITIES } from "./ArtifactManifest";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateArtifactManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];

  if (manifest === null || typeof manifest !== "object") {
    return { valid: false, errors: ["manifest must be a non-null object"] };
  }

  const m = manifest as Record<string, unknown>;

  // schema
  if (typeof m.schema !== "number") {
    errors.push("schema must be a number");
  } else if (m.schema !== MANIFEST_SCHEMA_VERSION) {
    errors.push(`schema must be ${MANIFEST_SCHEMA_VERSION}, got ${m.schema}`);
  }

  // name
  if (!ARTIFACT_NAMES.includes(m.name as any)) {
    errors.push(`name must be one of: ${ARTIFACT_NAMES.join(", ")}`);
  }

  // version
  if (typeof m.version !== "string" || !m.version) {
    errors.push("version must be a non-empty string");
  }

  // createdAt
  if (typeof m.createdAt !== "string" || !m.createdAt) {
    errors.push("createdAt must be a non-empty string");
  }

  // source
  if (m.source === null || typeof m.source !== "object") {
    errors.push("source must be an object");
  } else {
    const s = m.source as Record<string, unknown>;
    if (typeof s.remote !== "string" || !s.remote) {
      errors.push("source.remote must be a non-empty string");
    }
    if (typeof s.ref !== "string" || !s.ref) {
      errors.push("source.ref must be a non-empty string");
    }
  }

  // toolchain
  if (m.toolchain === null || typeof m.toolchain !== "object") {
    errors.push("toolchain must be an object");
  } else {
    const t = m.toolchain as Record<string, unknown>;
    if (typeof t.emscripten !== "string" || !t.emscripten) {
      errors.push("toolchain.emscripten must be a non-empty string");
    }
  }

  // capabilities
  if (!Array.isArray(m.capabilities)) {
    errors.push("capabilities must be an array");
  } else {
    for (const cap of m.capabilities) {
      if (!RUNTIME_CAPABILITIES.includes(cap as any)) {
        errors.push(`unknown capability: ${cap}`);
      }
    }
  }

  // requirements
  if (m.requirements !== undefined && (m.requirements === null || typeof m.requirements !== "object")) {
    errors.push("requirements must be an object if present");
  }

  // artifacts
  if (m.artifacts === null || typeof m.artifacts !== "object") {
    errors.push("artifacts must be a non-null object");
  } else {
    const artifacts = m.artifacts as Record<string, unknown>;
    for (const [key, entry] of Object.entries(artifacts)) {
      if (entry === null || typeof entry !== "object") {
        errors.push(`artifact "${key}" must be a non-null object`);
        continue;
      }
      const e = entry as Record<string, unknown>;
      if (typeof e.path !== "string" || !e.path) {
        errors.push(`artifact "${key}": path must be a non-empty string`);
      }
      if (typeof e.mediaType !== "string" || !e.mediaType) {
        errors.push(`artifact "${key}": mediaType must be a non-empty string`);
      }
      if (e.bytes !== undefined && typeof e.bytes !== "number") {
        errors.push(`artifact "${key}": bytes must be a number`);
      }
      if (e.compressedBytes !== undefined && typeof e.compressedBytes !== "number") {
        errors.push(`artifact "${key}": compressedBytes must be a number`);
      }
      if (e.decompressedBytes !== undefined && typeof e.decompressedBytes !== "number") {
        errors.push(`artifact "${key}": decompressedBytes must be a number`);
      }
      if (e.sha256 !== undefined && typeof e.sha256 !== "string") {
        errors.push(`artifact "${key}": sha256 must be a string`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
