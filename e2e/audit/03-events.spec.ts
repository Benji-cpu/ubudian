import { test, expect } from "@playwright/test";
import {
  runStandardChecks,
  collectConsoleErrors,
  waitForPageReady,
  auditScreenshot,
  SEEDED_SLUGS,
} from "./helpers";

test.describe("Events Audit", () => {
  test("events listing page loads", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/events");
    const result = await runStandardChecks(page, "events-list");

    // Should have a heading
    await expect(page.locator("h1, h2").first()).toBeVisible();

    if (result.horizontalOverflow.length) {
      console.log("Events list overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Events list console errors:", errors);
    }
  });

  test("events view switcher and filters work", async ({ page }) => {
    await page.goto("/events");
    await waitForPageReady(page);

    // Check for view switcher (list/grid/calendar)
    const viewButtons = page.locator('button:has(svg), [role="tablist"] button');
    const viewCount = await viewButtons.count();
    if (viewCount > 0) {
      console.log(`Found ${viewCount} view/filter buttons`);
    }

    // Check for category filter
    const filterElements = page.locator(
      'select, [role="combobox"], button:has-text("Category"), button:has-text("Filter")'
    );
    const filterCount = await filterElements.count();
    console.log(`Found ${filterCount} filter elements`);

    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    const hasSearch = await searchInput.count();
    console.log(`Search input: ${hasSearch > 0 ? "found" : "not found"}`);

    await auditScreenshot(page, "events-filters");
  });

  for (const slug of SEEDED_SLUGS.events) {
    test(`event detail: ${slug}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      const response = await page.goto(`/events/${slug}`);

      expect(
        response?.status(),
        `Event ${slug} returned ${response?.status()}`
      ).toBeLessThan(400);

      const result = await runStandardChecks(page, `event-${slug}`);

      // Should have a title
      await expect(page.locator("h1").first()).toBeVisible();

      if (result.horizontalOverflow.length) {
        console.log(`Event ${slug} overflow:`, result.horizontalOverflow);
      }
      if (result.brokenImages.length) {
        console.log(`Event ${slug} broken images:`, result.brokenImages);
      }
      if (errors.length) {
        console.log(`Event ${slug} console errors:`, errors);
      }
    });
  }

  test("event submission form loads", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/events/submit");
    const result = await runStandardChecks(page, "event-submit-form");

    // Should have a form (use main content area to avoid footer form)
    const form = page.locator("main form, [role='main'] form, form").first();
    await expect(form).toBeVisible();

    // Should have input fields
    const inputs = page.locator("input, textarea, select");
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(3);

    if (result.horizontalOverflow.length) {
      console.log("Event submit form overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Event submit form console errors:", errors);
    }
  });
});
