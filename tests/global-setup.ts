import * as dotenv from "dotenv";
// Załaduj zmienne środowiskowe z pliku .env.test na początku
const envPath = process.cwd() + "/.env.test";
// Załaduj zmienne z .env.test
dotenv.config({ path: envPath });

import * as fs from "fs";
import { chromium } from "@playwright/test";

// Wyświetl informacje diagnostyczne (bez ujawniania wrażliwych danych)
/**
 * Global setup dla testów Playwright z Supabase.
 * Funkcja loguje do konta e2e, zapisuje stan uwierzytelnienia i przygotowuje środowisko testowe.
 */
export default async function globalSetup() {
  console.log("Navigating to login page...");

  try {
    // Sprawdź czy zmienne środowiskowe są dostępne
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Przejdź do strony logowania
    await page.goto(`${process.env.BASE_URL || "http://localhost:3000"}/auth/login`);

    console.log(`Current URL after navigation: ${page.url()}`);

    // Logowanie do aplikacji
    console.log("Attempting to login...");

    if (username && password) {
      try {
        // Wypełnij formularz logowania
        await page.locator('input[name="email"]').fill(username);
        await page.locator('input[name="password"]').fill(password);
        await page.locator('button[type="submit"]').click();

        // Poczekaj na przekierowanie
        await page.waitForURL(`${process.env.BASE_URL || "http://localhost:3000"}/dashboard`, { timeout: 10000 });

        // Zapisz stan uwierzytelnienia do użycia w testach
        await page.context().storageState({ path: "playwright/.auth/user.json" });
        console.log("Authentication state saved successfully");
      } catch (error) {
        console.error("Error in login process:", error);
        // Utwórz pusty plik auth state jako fallback
        fs.writeFileSync("playwright/.auth/user.json", JSON.stringify({}));
        console.log("Created empty auth state file as fallback");
      }
    } else {
      console.error("Error in global setup: E2E_USERNAME or E2E_PASSWORD not set");
      // Utwórz pusty plik auth state jako fallback
      fs.writeFileSync("playwright/.auth/user.json", JSON.stringify({}));
      console.log("Created empty auth state file as fallback");
    }

    await browser.close();
    console.log("Global setup complete");
  } catch (error) {
    console.error("Error in global setup:", error);
    // Upewnij się, że ścieżka istnieje
    fs.mkdirSync("playwright/.auth", { recursive: true });
    fs.writeFileSync("playwright/.auth/user.json", JSON.stringify({}));
    console.log("Created empty auth state file as fallback");
  }
}
