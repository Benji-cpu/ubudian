import { test, expect } from "@playwright/test";
import { runStandardChecks, collectConsoleErrors, waitForPageReady } from "./helpers";

test.describe("About, Login & 404 Audit", () => {
  test("about page loads with content", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/about");
    const result = await runStandardChecks(page, "about");

    // Should have a heading
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Should have meaningful text content
    const bodyText = await page.locator("main, [role='main'], body").first().textContent();
    expect((bodyText || "").length).toBeGreaterThan(100);

    if (result.horizontalOverflow.length) {
      console.log("About page overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("About page console errors:", errors);
    }
  });

  test("login page loads with auth button", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/login");
    const result = await runStandardChecks(page, "login");

    // Should have a login button (Google OAuth, etc.)
    const authButton = page.locator(
      'button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Google"), a:has-text("Sign in"), a:has-text("Google")'
    );
    const hasAuth = await authButton.count();
    expect(hasAuth, "Login page should have auth button").toBeGreaterThanOrEqual(1);

    if (result.horizontalOverflow.length) {
      console.log("Login page overflow:", result.horizontalOverflow);
    }
    if (errors.length) {
      console.log("Login page console errors:", errors);
    }
  });

  test("404 page for nonexistent route", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/this-page-does-not-exist-12345");
    const result = await runStandardChecks(page, "404-page");

    // Should show some kind of not-found indication
    const notFoundIndicator = page.locator(
      'text=/not found/i, text=/404/i, text=/page.*exist/i'
    );
    const has404 = await notFoundIndicator.count();
    console.log(`404 page indicator: ${has404 > 0 ? "found" : "not found"}`);

    if (errors.length) {
      console.log("404 page console errors:", errors);
    }
  });
});
