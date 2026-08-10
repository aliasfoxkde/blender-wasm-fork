import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  /* Exclude @deployed tests by default — they require a live deployment and
   * must be run explicitly with --grep "@deployed" or by setting BASE_URL. */
  grepInvert: /@deployed/,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node scripts/serve.mjs app/dist 4173",
    url: "http://localhost:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    cwd: process.cwd(),
  },
});
