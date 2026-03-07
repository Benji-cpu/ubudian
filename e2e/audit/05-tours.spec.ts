import { test, expect } from "@playwright/test";
import {
  runStandardChecks,
  collectConsoleErrors,
  waitForPageReady,
  SEEDED_SLUGS,
} from "./helpers";

test.describe("Tours Audit", () => {
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

  for (const slug of SEEDED_SLUGS.tours) {
    test(`tour detail: ${slug}`, async ({ page }) => {
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
    });
  }

  test("tour detail has WhatsApp booking CTA", async ({ page }) => {
    await page.goto(`/tours/${SEEDED_SLUGS.tours[0]}`);
    await waitForPageReady(page);

    // Look for WhatsApp link or booking button
    const whatsappLink = page.locator(
      'a[href*="wa.me"], a[href*="whatsapp"], a:has-text("WhatsApp"), a:has-text("Book"), button:has-text("Book")'
    );
    const count = await whatsappLink.count();
    console.log(`WhatsApp/booking CTA found: ${count > 0 ? "yes" : "no"}`);
  });
});
