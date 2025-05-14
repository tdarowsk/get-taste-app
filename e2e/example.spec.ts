import { test, expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

// Page object for the Playwright website
class PlaywrightPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("https://playwright.dev/");
  }

  async getTitle() {
    return this.page.title();
  }

  async clickGetStartedLink() {
    await this.page.getByRole("link", { name: "Get started" }).click();
  }

  async getInstallationHeading(): Promise<Locator> {
    return this.page.getByRole("heading", { name: "Installation" });
  }
}

test.describe("Playwright website", () => {
  let playwrightPage: PlaywrightPage;

  test.beforeEach(async ({ page }) => {
    playwrightPage = new PlaywrightPage(page);
    await playwrightPage.goto();
  });

  test("has title", async () => {
    // Use expect with specific matchers
    expect(await playwrightPage.getTitle()).toContain("Playwright");
  });

  test("get started link", async () => {
    // Click the get started link using the page object
    await playwrightPage.clickGetStartedLink();

    // Expects page to have a heading with the name of Installation
    const heading = await playwrightPage.getInstallationHeading();
    await expect(heading).toBeVisible();
  });
});
