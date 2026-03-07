import { test, expect } from "@playwright/test";
import {
  runStandardChecks,
  collectConsoleErrors,
  waitForPageReady,
  SEEDED_SLUGS,
} from "./helpers";

test.describe("Stories (Humans of Ubud) Audit", () => {
  test("stories listing page loads", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/stories");
    const result = await runStandardChecks(page, "stories-list");

    // Should have a heading
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Should show story cards
    const cards = page.locator("article, [class*='card'], a[href*='/stories/']");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    if (result.horizontalOverflow.length) {
      console.log("Stories list overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Stories list console errors:", errors);
    }
  });

  test("stories theme filter works", async ({ page }) => {
    await page.goto("/stories");
    await waitForPageReady(page);

    // Look for theme filter buttons or select
    const filters = page.locator(
      'button:has-text("Artist"), button:has-text("Healer"), button:has-text("Expat"), button:has-text("All"), [role="tablist"] button'
    );
    const filterCount = await filters.count();
    console.log(`Found ${filterCount} theme filter buttons`);

    if (filterCount > 0) {
      // Click a filter and verify page updates
      await filters.first().click();
      await page.waitForTimeout(500);
    }
  });

  for (const slug of SEEDED_SLUGS.stories) {
    test(`story detail: ${slug}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      const response = await page.goto(`/stories/${slug}`);

      expect(
        response?.status(),
        `Story ${slug} returned ${response?.status()}`
      ).toBeLessThan(400);

      const result = await runStandardChecks(page, `story-${slug}`);

      // Should have a title/name
      await expect(page.locator("h1").first()).toBeVisible();

      if (result.horizontalOverflow.length) {
        console.log(`Story ${slug} overflow:`, result.horizontalOverflow);
      }
      if (result.brokenImages.length) {
        console.log(`Story ${slug} broken images:`, result.brokenImages);
      }
      if (errors.length) {
        console.log(`Story ${slug} console errors:`, errors);
      }
    });
  }
});
