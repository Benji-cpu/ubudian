import { test, expect } from "@playwright/test";
import {
  runStandardChecks,
  collectConsoleErrors,
  waitForPageReady,
  SEEDED_SLUGS,
} from "./helpers";

test.describe("Newsletter Audit", () => {
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

  for (const slug of SEEDED_SLUGS.newsletter) {
    test(`newsletter edition: ${slug}`, async ({ page }) => {
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
    });
  }

  test("newsletter prev/next navigation", async ({ page }) => {
    await page.goto(`/newsletter/${SEEDED_SLUGS.newsletter[0]}`);
    await waitForPageReady(page);

    // Look for prev/next links
    const prevNext = page.locator(
      'a:has-text("Previous"), a:has-text("Next"), a:has-text("Prev"), [aria-label*="previous" i], [aria-label*="next" i]'
    );
    const count = await prevNext.count();
    console.log(`Prev/next navigation links: ${count}`);
  });
});
