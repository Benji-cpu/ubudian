import { test, expect } from "@playwright/test";
import {
  runStandardChecks,
  collectConsoleErrors,
  waitForPageReady,
  sectionEnabled,
  discoverSlugs,
} from "./helpers";

test.describe("Newsletter Audit", () => {
  // Flag-gated section (site_settings). Off since 2026-08-03: every test here
  // skips rather than asserting on a 404, and runs again the day it is switched on.
  test.beforeEach(async ({ page }) => {
    test.skip(!(await sectionEnabled(page, "/newsletter")), "Newsletter archive is switched off in site_settings");
  });

  test("newsletter listing page loads", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/newsletter");
    const result = await runStandardChecks(page, "newsletter-list");

    // Should have a heading
    await expect(page.locator("h1, h2").first()).toBeVisible();

    if (result.horizontalOverflow.length) {
      console.log("Newsletter list overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Newsletter list console errors:", errors);
    }
  });

  test("newsletter signup form exists", async ({ page }) => {
    await page.goto("/newsletter");
    await waitForPageReady(page);

    // Look for email input and subscribe button
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email" i]'
    );
    const hasEmailInput = await emailInput.count();
    console.log(`Newsletter email input: ${hasEmailInput > 0 ? "found" : "not found"}`);

    const subscribeButton = page.locator(
      'button:has-text("Subscribe"), button:has-text("Sign up"), button[type="submit"]'
    );
    const hasButton = await subscribeButton.count();
    console.log(`Subscribe button: ${hasButton > 0 ? "found" : "not found"}`);
  });

  test("newsletter edition: pages render for live entries", async ({ page }) => {
    test.setTimeout(120000);
    const slugs = await discoverSlugs(page, "/newsletter", 3);
    test.skip(slugs.length === 0, "no newsletter archive entries linked from the listing");
    for (const slug of slugs) {
      const errors = collectConsoleErrors(page);
      const response = await page.goto(`/newsletter/${slug}`);

      expect(
        response?.status(),
        `Newsletter ${slug} returned ${response?.status()}`
      ).toBeLessThan(400);

      const result = await runStandardChecks(page, `newsletter-${slug}`);

      // Should have a title
      await expect(page.locator("h1").first()).toBeVisible();

      if (result.horizontalOverflow.length) {
        console.log(`Newsletter ${slug} overflow:`, result.horizontalOverflow);
      }
      if (errors.length) {
        console.log(`Newsletter ${slug} console errors:`, errors);
      }
    }
  });

  test("newsletter prev/next navigation", async ({ page }) => {
    const [first] = await discoverSlugs(page, "/newsletter", 1);
    test.skip(!first, "no editions linked from the archive");
    await page.goto(`/newsletter/${first}`);
    await waitForPageReady(page);

    // Look for prev/next links
    const prevNext = page.locator(
      'a:has-text("Previous"), a:has-text("Next"), a:has-text("Prev"), [aria-label*="previous" i], [aria-label*="next" i]'
    );
    const count = await prevNext.count();
    console.log(`Prev/next navigation links: ${count}`);
  });
});
