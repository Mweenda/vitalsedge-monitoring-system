import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests expect Firebase Auth (9099) and Firestore (8080) emulators running.
 * Start them first: pnpm run emulators:start (or firebase emulators:start)
 * Then: pnpm run dev:frontend
 * Or rely on webServer below for the app only.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm run dev:frontend",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
