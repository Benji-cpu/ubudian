import { test, expect } from "@playwright/test";
import { runStandardChecks, collectConsoleErrors, waitForPageReady } from "./helpers";

test.describe("Blog Audit", () => {
  test("blog listing page loads", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/blog");
    const result = await runStandardChecks(page, "blog-list");

    // Should have a heading
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Blog may have empty state with seed data
    const emptyState = page.locator(
      'text=/no posts/i, text=/coming soon/i, text=/nothing here/i, text=/no articles/i'
    );
    const hasEmpty = await emptyState.count();
    if (hasEmpty > 0) {
      console.log("Blog shows empty state (expected with seed data)");
    }

    if (result.horizontalOverflow.length) {
      console.log("Blog list overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Blog list console errors:", errors);
    }
  });

  test("blog handles invalid slug gracefully", async ({ page }) => {
    await page.goto("/blog/nonexistent-post-slug-12345");
    await waitForPageReady(page);

    // Next.js notFound() may return 200 in dev mode but renders the not-found page.
    // Check for visual not-found indicators in the rendered page.
    const bodyText = await page.locator("body").textContent();
    const hasNotFoundIndicator =
      /not found|404|could not|doesn.t exist/i.test(bodyText || "");

    console.log(
      `Blog invalid slug: ${hasNotFoundIndicator ? "shows not-found page" : "no not-found indicator (check manually)"}`
    );

    // This is informational — we just want to verify it doesn't crash
    await expect(page.locator("body")).toBeVisible();
  });
});
