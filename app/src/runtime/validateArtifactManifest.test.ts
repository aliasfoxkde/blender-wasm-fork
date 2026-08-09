import { describe, it, expect } from "vitest";
import { validateArtifactManifest } from "./validateArtifactManifest";

const VALID_MANIFEST = {
  schema: 1,
  name: "cycles-render",
  version: "1.0.0",
  createdAt: "2026-08-08T00:00:00Z",
  source: {
    remote: "https://github.com/HeyPuter/blender",
    ref: "6b031d3d41c392883e3c495aa72343e10d15b43d",
  },
  toolchain: {
    emscripten: "6.0.1",
  },
  capabilities: ["headless-render", "pthreads"],
  requirements: {
    crossOriginIsolated: true,
    sharedArrayBuffer: true,
    minimumMemoryMb: 2048,
  },
  artifacts: {
    "blender.js": {
      path: "blender.js",
      mediaType: "application/javascript",
      bytes: 500000,
    },
    "blender.wasm.zst": {
      path: "blender.wasm.zst",
      mediaType: "application/wasm",
      compressedBytes: 20000000,
      decompressedBytes: 50000000,
    },
    "assets.tar.zst": {
      path: "assets.tar.zst",
      mediaType: "application/octet-stream",
      compressedBytes: 30000000,
      decompressedBytes: 100000000,
    },
  },
};

describe("validateArtifactManifest", () => {
  it("accepts a valid manifest", () => {
    const result = validateArtifactManifest(VALID_MANIFEST);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects null", () => {
    const result = validateArtifactManifest(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("manifest must be a non-null object");
  });

  it("rejects a non-object", () => {
    const result = validateArtifactManifest("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/non-null object/);
  });

  it("rejects wrong schema version", () => {
    const result = validateArtifactManifest({ ...VALID_MANIFEST, schema: 99 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("schema"))).toBe(true);
  });

  it("rejects missing name", () => {
    const { name, ...rest } = VALID_MANIFEST as any;
    const result = validateArtifactManifest({ ...rest, name: "invalid-name" });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("name"))).toBe(true);
  });

  it("rejects missing version", () => {
    const { version, ...rest } = VALID_MANIFEST as any;
    const result = validateArtifactManifest({ ...rest, version: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("version"))).toBe(true);
  });

  it("rejects missing source.ref", () => {
    const result = validateArtifactManifest({
      ...VALID_MANIFEST,
      source: { ...VALID_MANIFEST.source, ref: "" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("source.ref"))).toBe(true);
  });

  it("rejects unknown capability", () => {
    const result = validateArtifactManifest({
      ...VALID_MANIFEST,
      capabilities: ["headless-render", "not-a-capability"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("capability"))).toBe(true);
  });

  it("rejects artifact with missing path", () => {
    const result = validateArtifactManifest({
      ...VALID_MANIFEST,
      artifacts: {
        "bad.js": { path: "", mediaType: "application/javascript" },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("path"))).toBe(true);
  });

  it("rejects artifact with non-number bytes", () => {
    const result = validateArtifactManifest({
      ...VALID_MANIFEST,
      artifacts: {
        "bad.js": { path: "bad.js", mediaType: "application/javascript", bytes: "not a number" },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("bytes"))).toBe(true);
  });

  it("accepts manifest with no requirements", () => {
    const result = validateArtifactManifest({ ...VALID_MANIFEST, requirements: undefined });
    expect(result.valid).toBe(true);
  });

  it("accepts manifest with extra fields (lenient)", () => {
    const result = validateArtifactManifest({ ...VALID_MANIFEST, extraField: "ignored" });
    expect(result.valid).toBe(true);
  });
});
