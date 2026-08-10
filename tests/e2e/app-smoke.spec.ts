import { test, expect } from "@playwright/test";

/**
 * App smoke test — verifies the product app shell loads correctly.
 *
 * Routes:
 *   /        — HomePage (landing page)
 *   /render  — RenderProofPage (render runtime page)
 */

test.describe("App smoke", () => {
  test("home page loads without crash", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test("home page shows heading", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Blender Web Runtime");
  });

  test("home page has go to render button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Go to Render")).toBeVisible();
  });

  test("render page shows unavailable state when artifacts are missing", async ({ page }) => {
    await page.goto("/render");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/not available/i)).toBeVisible();
  });

  test("render page shows make mvp hint", async ({ page }) => {
    await page.goto("/render");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/make mvp/i)).toBeVisible();
  });

  test("render page has no canvas element", async ({ page }) => {
    await page.goto("/render");
    await page.waitForLoadState("networkidle");
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(0);
  });

  test("render page diagnostics drawer is present", async ({ page }) => {
    await page.goto("/render");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Diagnostics")).toBeVisible();
  });

  test("render page diagnostics drawer shows WebGPU row", async ({ page }) => {
    await page.goto("/render");
    await page.waitForLoadState("networkidle");
    await page.getByText("Diagnostics").click();
    await expect(page.getByText("WebGPU")).toBeVisible();
  });

  test("PWA manifest is available", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const manifest = await page.evaluate(() => {
      try { return JSON.parse(document.body.textContent || ""); } catch { return null; }
    });
    expect(manifest?.name).toBe("Blender Web Runtime");
    expect(manifest?.short_name).toBe("Blender WASM");
  });

  test("PWA manifest has valid icon reference", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const manifest = await page.evaluate(async () => {
      const res = await fetch("/manifest.json");
      return res.json();
    });
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
