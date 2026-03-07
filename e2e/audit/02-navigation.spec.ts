import { test, expect } from "@playwright/test";
import { runStandardChecks, waitForPageReady, auditScreenshot } from "./helpers";

const PUBLIC_PAGES = [
  "/",
  "/events",
  "/stories",
  "/tours",
  "/newsletter",
  "/blog",
  "/quiz",
  "/about",
  "/login",
];

test.describe("Navigation Audit", () => {
  test("desktop nav links are visible and functional", async ({ page, browserName }, testInfo) => {
    if (testInfo.project.name === "mobile") {
      test.skip();
      return;
    }

    await page.goto("/");
    await waitForPageReady(page);

    // Desktop nav should have visible links
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();

    const navLinks = nav.locator('a[href^="/"]');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("mobile hamburger menu opens and closes", async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop") {
      test.skip();
      return;
    }

    await page.goto("/");
    await waitForPageReady(page);

    // The mobile menu trigger has sr-only text "Open menu"
    const menuButton = page.getByRole("button", { name: /open menu/i });

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      await auditScreenshot(page, "mobile-menu-open");

      // Sheet renders in a dialog portal — look for nav links inside it
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      const mobileNav = dialog.locator('a[href="/events"]');
      await expect(mobileNav).toBeVisible({ timeout: 3000 });

      // Close via Escape (most reliable — the sheet has two close buttons)
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      await auditScreenshot(page, "mobile-menu-closed");
    } else {
      console.log("WARNING: No mobile hamburger menu button found");
    }
  });

  test("footer is present on all pages", async ({ page }) => {
    test.setTimeout(120000);
    for (const url of PUBLIC_PAGES) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      const footer = page.locator("footer");
      await expect(footer, `Footer missing on ${url}`).toBeVisible({ timeout: 10000 });
    }
  });

  test("all nav links resolve without error", async ({ page }) => {
    test.setTimeout(120000);
    await page.goto("/");
    await waitForPageReady(page);

    // Collect all unique navigation links
    const allLinks = page.locator('nav a[href^="/"], footer a[href^="/"]');
    const count = await allLinks.count();
    const hrefs = new Set<string>();
    for (let i = 0; i < count; i++) {
      const href = await allLinks.nth(i).getAttribute("href");
      if (href && !href.startsWith("/admin") && !href.startsWith("/dashboard")) {
        hrefs.add(href);
      }
    }

    const brokenLinks: string[] = [];
    for (const href of hrefs) {
      const response = await page.request.get(href);
      if (response.status() >= 400) {
        brokenLinks.push(`${href} (${response.status()})`);
      }
    }

    if (brokenLinks.length) {
      console.log("BROKEN NAV LINKS:", brokenLinks);
    }
    expect(brokenLinks, `Broken nav/footer links: ${brokenLinks.join(", ")}`).toHaveLength(0);
  });
});
