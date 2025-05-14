import * as dotenv from "dotenv";
// Załaduj zmienne środowiskowe z pliku .env.test na początku
const envPath = process.cwd() + "/.env.test";
// Załaduj zmienne z .env.test
dotenv.config({ path: envPath });

import * as fs from "fs";
import * as path from "path";
import { chromium } from "@playwright/test";

// Ensure auth directory exists
const authDir = path.join(process.cwd(), "tests");
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// Wyświetl informacje diagnostyczne (bez ujawniania wrażliwych danych)
/**
 * Global setup dla testów Playwright z Supabase.
 * Funkcja loguje do konta e2e, zapisuje stan uwierzytelnienia i przygotowuje środowisko testowe.
 */
export default async function globalSetup() {
  try {
    // Sprawdź czy zmienne środowiskowe są dostępne
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Przejdź do strony logowania
    await page.goto(`${process.env.BASE_URL || "http://localhost:3000"}/auth/login`);

    // Logowanie do aplikacji
    if (username && password) {
      try {
        // Wypełnij formularz logowania
        await page.locator('input[name="email"]').fill(username);
        await page.locator('input[name="password"]').fill(password);
        await page.locator('button[type="submit"]').click();

        // Increase timeout for login and use more resilient approach
        try {
          // Poczekaj na przekierowanie z dłuższym timeoutem
          await page.waitForURL(`${process.env.BASE_URL || "http://localhost:3000"}/dashboard`, {
            timeout: 30000,
          });
        } catch {
          console.warn("URL redirect timeout, trying to continue anyway");
          // Take a screenshot to debug the issue
          await page.screenshot({ path: path.join(process.cwd(), "login-timeout.png") });
        }

        // Save auth state to tests directory instead of playwright/.auth
        await page.context().storageState({ path: "tests/auth.json" });
        console.log("Authentication state saved successfully");
      } catch (error) {
        console.error("Error in login process:", error);
        // Create empty auth state as fallback
        fs.writeFileSync("tests/auth.json", JSON.stringify({}));
      }
    } else {
      console.error("Error in global setup: E2E_USERNAME or E2E_PASSWORD not set");
      // Create empty auth state as fallback
      fs.writeFileSync("tests/auth.json", JSON.stringify({}));
    }

    await browser.close();
  } catch (error) {
    console.error("Error in global setup:", error);
    // Create empty auth state as fallback
    fs.writeFileSync("tests/auth.json", JSON.stringify({}));
  }
}
