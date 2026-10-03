/**
 * Tooling · Playwright (E2E)
 *
 * Two ways to run, same tests:
 * - Local / CI job: no E2E_BASE_URL → Playwright starts `next start` itself
 *   (run `npm run build` first). Fast feedback, fake env, public pages only.
 * - Against a Vercel Preview: E2E_BASE_URL=<preview url>. Real env and real
 *   data, triggered by .github/workflows/e2e-preview.yml after each deploy.
 *
 * Tradeoff: E2E is the slowest and flakiest layer, so it covers only the
 * critical happy paths; rules belong in service/route unit tests.
 */
import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Lets CI reach Previews protected by Vercel Deployment Protection.
    extraHTTPHeaders: bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : undefined,
    // Cloud sandboxes ship a pinned Chromium; locally Playwright's own is used.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
