import { test, expect } from "@playwright/test";

test.describe("Newsletter Signup", () => {
  test("loads the newsletter page", async ({ page }) => {
    await page.goto("/newsletter");
    await expect(page.locator("h1")).toContainText("Newsletter");
  });

  test("shows email input in signup form", async ({ page }) => {
    await page.goto("/newsletter");
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible();
  });

  test("can enter email and submit", async ({ page }) => {
    await page.goto("/newsletter");
    const emailInput = page.getByPlaceholder(/email/i).first();
    await emailInput.fill("e2e-test@example.com");

    // Find and click the subscribe button near the input
    const form = emailInput.locator("xpath=ancestor::form");
    await form.getByRole("button").click();

    // Should show some feedback (success or already subscribed)
    await page.waitForTimeout(2000);
  });
});
