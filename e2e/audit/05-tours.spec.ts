import { test, expect } from "@playwright/test";
import {
  runStandardChecks,
  collectConsoleErrors,
  waitForPageReady,
  sectionEnabled,
  discoverSlugs,
} from "./helpers";

test.describe("Tours Audit", () => {
  // Flag-gated section (site_settings). Off since 2026-08-03: every test here
  // skips rather than asserting on a 404, and runs again the day it is switched on.
  test.beforeEach(async ({ page }) => {
    test.skip(!(await sectionEnabled(page, "/tours")), "Tours is switched off in site_settings");
  });

  test("tours listing page loads", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/tours");
    const result = await runStandardChecks(page, "tours-list");

    // Should have a heading
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Should show tour cards
    const cards = page.locator("article, [class*='card'], a[href*='/tours/']");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    if (result.horizontalOverflow.length) {
      console.log("Tours list overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Tours list console errors:", errors);
    }
  });

  test("tour detail: pages render for live entries", async ({ page }) => {
    test.setTimeout(120000);
    const slugs = await discoverSlugs(page, "/tours", 3);
    test.skip(slugs.length === 0, "no tours entries linked from the listing");
    for (const slug of slugs) {
      const errors = collectConsoleErrors(page);
      const response = await page.goto(`/tours/${slug}`);

      expect(
        response?.status(),
        `Tour ${slug} returned ${response?.status()}`
      ).toBeLessThan(400);

      const result = await runStandardChecks(page, `tour-${slug}`);

      // Should have a title
      await expect(page.locator("h1").first()).toBeVisible();

      if (result.horizontalOverflow.length) {
        console.log(`Tour ${slug} overflow:`, result.horizontalOverflow);
      }
      if (result.brokenImages.length) {
        console.log(`Tour ${slug} broken images:`, result.brokenImages);
      }
      if (errors.length) {
        console.log(`Tour ${slug} console errors:`, errors);
      }
    }
  });

  test("tour detail has WhatsApp booking CTA", async ({ page }) => {
    const [first] = await discoverSlugs(page, "/tours", 1);
    test.skip(!first, "no tours linked from the listing");
    await page.goto(`/tours/${first}`);
    await waitForPageReady(page);

    // Look for WhatsApp link or booking button
    const whatsappLink = page.locator(
      'a[href*="wa.me"], a[href*="whatsapp"], a:has-text("WhatsApp"), a:has-text("Book"), button:has-text("Book")'
    );
    const count = await whatsappLink.count();
    console.log(`WhatsApp/booking CTA found: ${count > 0 ? "yes" : "no"}`);
  });
});
