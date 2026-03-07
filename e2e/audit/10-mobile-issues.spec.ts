import { test, expect } from "@playwright/test";
import {
  waitForPageReady,
  checkNoHorizontalOverflow,
  checkTouchTargets,
  checkTextReadability,
  checkImagesLoaded,
  auditScreenshot,
} from "./helpers";

// Only run on mobile project
test.describe("Mobile-Specific Issues", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== "mobile") {
      test.skip();
    }
  });

  const PAGES_TO_CHECK = [
    { url: "/", name: "homepage" },
    { url: "/events", name: "events-list" },
    { url: "/stories", name: "stories-list" },
    { url: "/tours", name: "tours-list" },
    { url: "/newsletter", name: "newsletter-list" },
    { url: "/blog", name: "blog-list" },
    { url: "/quiz", name: "quiz" },
    { url: "/about", name: "about" },
    { url: "/login", name: "login" },
    { url: "/events/submit", name: "event-submit" },
  ];

  for (const { url, name } of PAGES_TO_CHECK) {
    test(`horizontal overflow check: ${name}`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForPageReady(page);
      const overflow = await checkNoHorizontalOverflow(page);
      if (overflow.length) {
        console.log(`OVERFLOW on ${name}:`, overflow);
      }
    });

    test(`touch targets check: ${name}`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForPageReady(page);
      const undersized = await checkTouchTargets(page);
      if (undersized.length) {
        console.log(`UNDERSIZED TARGETS on ${name} (${undersized.length}):`, undersized.slice(0, 10));
      }
    });

    test(`text readability check: ${name}`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForPageReady(page);
      const smallText = await checkTextReadability(page);
      if (smallText.length) {
        console.log(`SMALL TEXT on ${name} (${smallText.length}):`, smallText.slice(0, 10));
      }
    });
  }

  test("mobile menu navigation reaches all pages", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("/");
    await waitForPageReady(page);

    // Open mobile menu via the Sheet trigger
    const menuButton = page.getByRole("button", { name: /open menu/i });

    if (!(await menuButton.isVisible())) {
      console.log("WARNING: No mobile menu button found — skipping menu navigation test");
      return;
    }

    await menuButton.click();
    await page.waitForTimeout(500);

    // Sheet renders in a dialog portal
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Collect nav links from the Sheet dialog
    const navLinks = dialog.locator('a[href^="/"]');
    const count = await navLinks.count();
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      if (await navLinks.nth(i).isVisible()) {
        const href = await navLinks.nth(i).getAttribute("href");
        if (href && !href.startsWith("/admin") && !href.startsWith("/dashboard")) {
          hrefs.push(href);
        }
      }
    }

    console.log(`Mobile menu links found: ${hrefs.join(", ")}`);

    // Verify each link resolves
    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(
        response.status(),
        `Mobile nav link ${href} returned ${response.status()}`
      ).toBeLessThan(400);
    }
  });

  test("form usability on mobile", async ({ page }) => {
    await page.goto("/events/submit", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    await auditScreenshot(page, "mobile-event-form");

    // Check that form inputs are full-width or near-full-width
    const inputs = page.locator("input, textarea, select");
    const count = await inputs.count();
    const viewportWidth = 375;
    const narrowInputs: string[] = [];

    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox();
      if (box && box.width < viewportWidth * 0.7 && box.width > 0) {
        const tag = await inputs.nth(i).evaluate((el) => el.tagName.toLowerCase());
        const name = await inputs.nth(i).getAttribute("name");
        narrowInputs.push(`${tag}[name="${name}"] (${Math.round(box.width)}px)`);
      }
    }

    if (narrowInputs.length) {
      console.log("Narrow inputs on mobile form:", narrowInputs);
    }
  });

  test("images load on mobile", async ({ page }) => {
    test.setTimeout(90000);
    for (const { url, name } of PAGES_TO_CHECK.slice(0, 5)) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForPageReady(page);
      const broken = await checkImagesLoaded(page);
      if (broken.length) {
        console.log(`BROKEN IMAGES on ${name}:`, broken);
      }
    }
  });
});
