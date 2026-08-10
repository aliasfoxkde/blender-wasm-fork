import { test, expect } from "@playwright/test";

/**
 * Deployed smoke test — verifies the deployed Blender WASM runtime works.
 *
 * This test is designed to run against a LIVE deployment (preview server or
 * production URL). It is filtered out of normal CI runs and must be explicitly
 * enabled via:
 *   pnpm --filter blender-wasm-app test --grep "@deployed"
 *
 * Usage:
 *   BASE_URL=http://localhost:4173 pnpm --filter blender-wasm-app test --grep "@deployed"
 *   BASE_URL=https://your-deployment.com pnpm --filter blender-wasm-app test --grep "@deployed"
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

test.describe("Deployed smoke @deployed", () => {
  test("home page loads without crash", async ({ page }) => {
    await page.goto(BASE_URL);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test("home page shows heading", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("home page COOP/COEP headers are present", async ({ page }) => {
    const resp = await page.request.fetch(BASE_URL + "/");
    expect(resp.headers()["cross-origin-opener-policy"]).toBe("same-origin");
    expect(resp.headers()["cross-origin-embedder-policy"]).toBe("require-corp");
  });

  test("render page loads without crash", async ({ page }) => {
    await page.goto(BASE_URL + "/render.html");
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test("render page COOP/COEP headers are present", async ({ page }) => {
    const resp = await page.request.fetch(BASE_URL + "/render.html");
    expect(resp.headers()["cross-origin-opener-policy"]).toBe("same-origin");
    expect(resp.headers()["cross-origin-embedder-policy"]).toBe("require-corp");
  });

  test("render page emits __RENDER_DONE__ or __RENDER_FAIL__", async ({ page }) => {
    await page.goto(BASE_URL + "/render.html");
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
});
