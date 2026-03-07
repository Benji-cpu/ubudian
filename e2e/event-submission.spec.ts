import { test, expect } from "@playwright/test";

test.describe("Event Submission", () => {
  test("loads the submission form", async ({ page }) => {
    await page.goto("/events/submit");
    await expect(page.locator("h1")).toContainText("Submit");
    await expect(page.getByLabel(/event title/i)).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/events/submit");
    await page.getByRole("button", { name: /submit event/i }).click();
    await expect(page.getByText(/event title is required/i)).toBeVisible();
  });

  test("submits a valid event", async ({ page }) => {
    await page.goto("/events/submit");

    await page.getByLabel(/event title/i).fill("E2E Test Event");
    await page.getByLabel(/full description/i).fill("This is a test event submitted via Playwright E2E testing");
    await page.getByLabel(/your name/i).fill("E2E Tester");
    await page.getByLabel(/email/i).fill("e2e@test.com");
    await page.getByLabel(/contact/i).fill("+62123456789");

    // Select category
    await page.getByLabel(/category/i).click();
    await page.getByRole("option", { name: /community/i }).click();

    // Submit
    await page.getByRole("button", { name: /submit event/i }).click();

    // Should show success message
    await expect(page.getByText(/event submitted/i)).toBeVisible({ timeout: 10000 });
  });
});
