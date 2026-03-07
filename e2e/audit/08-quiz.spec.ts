import { test, expect } from "@playwright/test";
import {
  runStandardChecks,
  collectConsoleErrors,
  waitForPageReady,
  SEEDED_SLUGS,
} from "./helpers";

test.describe("Quiz Audit", () => {
  test("quiz page loads", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/quiz");
    const result = await runStandardChecks(page, "quiz");

    // Should have a heading or start button
    await expect(
      page.locator("h1, h2, button:has-text('Start'), button:has-text('Begin')").first()
    ).toBeVisible();

    if (result.horizontalOverflow.length) {
      console.log("Quiz page overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Quiz page console errors:", errors);
    }
  });

  for (const archetype of SEEDED_SLUGS.quiz_archetypes) {
    test(`quiz result: ${archetype}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      const response = await page.goto(`/quiz/results/${archetype}`);

      expect(
        response?.status(),
        `Quiz result ${archetype} returned ${response?.status()}`
      ).toBeLessThan(400);

      const result = await runStandardChecks(page, `quiz-result-${archetype}`);

      // Should have archetype name/title
      await expect(page.locator("h1, h2").first()).toBeVisible();

      if (result.horizontalOverflow.length) {
        console.log(`Quiz ${archetype} overflow:`, result.horizontalOverflow);
      }
      if (errors.length) {
        console.log(`Quiz ${archetype} console errors:`, errors);
      }
    });
  }
});
