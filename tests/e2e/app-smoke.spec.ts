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
});
