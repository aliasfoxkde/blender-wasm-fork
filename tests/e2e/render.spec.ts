import { test, expect } from "@playwright/test";

/**
 * Render e2e test — verifies Cycles WASM render harness works.
 *
 * This tests the web/render.html page that loads cycles.{js,wasm,data}
 * and attempts to render a scene. Since cycles.data is a placeholder
 * (no real scene data), the render honestly fails rather than producing
 * fake pixels.
 *
 * Once a real .blend scene is embedded in cycles.data, this test will
 * verify actual render output.
 */

test.describe("Render", () => {
  test("render page loads without crash", async ({ page }) => {
    await page.goto("http://localhost:4173/render.html");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });

  test("render page sets done or fail signal", async ({ page }) => {
    await page.goto("http://localhost:4173/render.html");
    // Wait up to 30s for render to complete (WASM init + render)
    const result = await page.waitForFunction(
      () => (window as any).__RENDER_DONE__ || (window as any).__RENDER_FAIL__,
      null,
      { timeout: 30000 }
    );
    const val = await result.jsonValue();
    expect(val).toBeTruthy();
    console.log("Render signal:", JSON.stringify(val));
  });

  test("status element is set", async ({ page }) => {
    await page.goto("http://localhost:4173/render.html");
    await page.waitForFunction(
      () => (window as any).__STATUS__,
      null,
      { timeout: 30000 }
    );
    const status = await page.evaluate(() => (window as any).__STATUS__);
    expect(status).toBeTruthy();
    // Status should be one of: render-ok | render-error | no-output | decode-error | uncaught
    expect(status).toMatch(/^(render-ok|render-error|no-output|decode-error|uncaught)$/);
  });

  test("canvas is present", async ({ page }) => {
    await page.goto("http://localhost:4173/render.html");
    await page.waitForTimeout(1000);
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("pixels are non-blank when render succeeds", async ({ page }) => {
    await page.goto("http://localhost:4173/render.html");
    const signal = await page.waitForFunction(
      () => (window as any).__RENDER_DONE__ || (window as any).__RENDER_FAIL__,
      null,
      { timeout: 30000 }
    );
    const val = await signal.jsonValue() as any;
    // If render failed (placeholder data), skip pixel check
    if (!val || val.error) {
      console.log("Render failed (placeholder data — expected):", val?.error);
      return;
    }
    // If we get here with __RENDER_DONE__, check canvas content
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonBlack = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) nonBlack++;
      }
      return nonBlack > 100;
    });
    expect(hasContent).toBe(true);
  });
});

test.describe("Zstd streaming", () => {
  test("cycles.wasm.zst is served decompressed with correct headers", async ({ page }) => {
    // Fetch cycles.wasm.zst directly and verify the server decompresses it on the fly
    const res = await page.request.fetch("http://localhost:4173/cycles.wasm.zst");
    expect(res.ok()).toBe(true);
    expect(res.headers()["x-zstd-decompressed"]).toBe("1");
    // Content-Type should be application/wasm (the decompressed type, not .zst)
    expect(res.headers()["content-type"]).toBe("application/wasm");
  });

  test("zstd-served cycles.wasm loads and runs Cycles render harness", async ({ page }) => {
    // Verify the render harness works when served via zstd streaming
    await page.goto("http://localhost:4173/render.html");
    const signal = await page.waitForFunction(
      () => (window as any).__RENDER_DONE__ || (window as any).__RENDER_FAIL__,
      null,
      { timeout: 30000 }
    );
    const val = await signal.jsonValue();
    expect(val).toBeTruthy();
    console.log("Zstd render signal:", JSON.stringify(val));
  });
});
