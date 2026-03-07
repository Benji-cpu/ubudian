import { test, expect } from "@playwright/test";
import { runStandardChecks, collectConsoleErrors, waitForPageReady } from "./helpers";

test.describe("Homepage Audit", () => {
  test("loads and renders hero section", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    const result = await runStandardChecks(page, "homepage");

    // Hero section should be visible
    await expect(page.locator("h1").first()).toBeVisible();

    // Log findings (non-blocking)
    if (result.horizontalOverflow.length) {
      console.log("Horizontal overflow:", result.horizontalOverflow);
    }
    if (result.brokenImages.length) {
      console.log("Broken images:", result.brokenImages);
    }
    if (errors.length) {
      console.log("Console errors:", errors);
    }
  });

  test("scroll-snap sections exist", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    // Check that main content sections are present
    const sections = page.locator("section");
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("CTA links resolve to valid pages", async ({ page }) => {
    test.setTimeout(120000);
    await page.goto("/");
    await waitForPageReady(page);

    // Find all internal CTA-style links
    const links = page.locator('a[href^="/"]');
    const count = await links.count();
    const hrefs = new Set<string>();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && !href.startsWith("/admin") && !href.startsWith("/dashboard")) {
        hrefs.add(href);
      }
    }

    // Verify a sample of links don't 404
    for (const href of Array.from(hrefs).slice(0, 10)) {
      const response = await page.request.get(href);
      expect(
        response.status(),
        `Link ${href} returned ${response.status()}`
      ).toBeLessThan(400);
    }
  });
});
