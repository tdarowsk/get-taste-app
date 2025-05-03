// Najpierw importujemy dotenv, aby załadować zmienne środowiskowe
import * as dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";
import path from "path";

// Załaduj zmienne środowiskowe z .env.test
const envPath = path.join(process.cwd(), ".env.test");
dotenv.config({ path: envPath });

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// Definiujemy konfigurację Playwright
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  /* Timeout configuration */
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  // Funkcje globalne do konfuguracji środowiska testowego
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 10000,
    /* Collect trace when retrying the failed test. */
    trace: "on-first-retry",
    // Użyj zapisanego stanu uwierzytelnienia, jeśli jest dostępny
    storageState: "playwright/.auth/user.json",
    // Ustaw tryb niepewny dla Playwright
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
  },
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // Wydłużony czas na uruchomienie serwera
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    /* Test against desktop browsers */
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
