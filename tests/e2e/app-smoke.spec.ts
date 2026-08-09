import { test, expect } from "@playwright/test";

/**
 * App smoke test — verifies the product app shell loads correctly.
 *
 * Since real render artifacts are not present (make mvp has not been run),
 * this test verifies the honest unavailable state instead of fake success.
 */

test.describe("App smoke", () => {
  test("app loads without crash", async ({ page }) => {
    // Navigate to the app — webServer in playwright.config starts the preview server
    await page.goto("/");

    // No crash / unhandled error
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test("shows heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Blender Web Runtime");
  });

  test("shows unavailable state when artifacts are missing", async ({ page }) => {
    await page.goto("/");
    // The unavailable state shows a message about artifacts not being available
    await expect(page.getByText(/not available/i)).toBeVisible();
  });

  test("shows make mvp hint", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/make mvp/i)).toBeVisible();
  });

  test("no canvas element (no fake Blender viewport)", async ({ page }) => {
    await page.goto("/");
    // The app should NOT have a canvas element at this stage
    // A canvas would indicate fake Blender output
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(0);
  });

  test("diagnostics drawer is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Diagnostics")).toBeVisible();
  });

  test("diagnostics drawer shows WebGPU row", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Diagnostics").click();
    await expect(page.getByText("WebGPU")).toBeVisible();
  });
});
