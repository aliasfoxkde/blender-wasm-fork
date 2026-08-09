import { test, expect } from "@playwright/test";

/**
 * Smoke WASM test — verifies the tiny pthreads+SIMD smoke module loads.
 *
 * This tests that emsdk + pthreads + SIMD + COOP/COEP are working.
 * The smoke module renders a Mandelbrot fractal using 8 pthread bands + SIMD.
 *
 * Run after `make smoke` produces web/smoke.js.
 */

test.describe("Smoke WASM", () => {
  test("smoke page loads without crash", async ({ page }) => {
    await page.goto("http://localhost:4173/smoke.html");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test("canvas renders non-blank output", async ({ page }) => {
    await page.goto("http://localhost:4173/smoke.html");
    // Wait for the canvas to show content (non-black pixels)
    await page.waitForTimeout(4000);
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      // Check that not all pixels are the same
      let nonBlack = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) nonBlack++;
      }
      return nonBlack > 100;
    });
    expect(hasContent).toBe(true);
  });

  test("required COOP/COEP headers are present", async ({ page }) => {
    const resp = await page.request.get("http://localhost:4173/smoke.html");
    expect(resp.headers()["cross-origin-opener-policy"]).toBe("same-origin");
    expect(resp.headers()["cross-origin-embedder-policy"]).toBe("require-corp");
  });
});
