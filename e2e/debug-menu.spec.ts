import { test, expect } from "@playwright/test";
import { ensureTestUser, signInAsUser, TEST_USER_EMAIL, TEST_USER_PASSWORD } from "./helpers/auth";

test("debug user menu click", async ({ page }) => {
  await ensureTestUser(TEST_USER_EMAIL, TEST_USER_PASSWORD, "user", "E2E Dashboard User");
  await signInAsUser(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3_000);

  // The UserMenu DropdownMenuTrigger has class "rounded-full" and "hidden md:block"
  // It wraps an Avatar
  const triggers = page.locator("header button");
  const count = await triggers.count();
  console.log("HEADER BUTTONS:", count);
  for (let i = 0; i < count; i++) {
    const classes = await triggers.nth(i).getAttribute("class");
    const text = await triggers.nth(i).textContent();
    console.log(`  Button ${i}: class="${classes?.slice(0, 80)}" text="${text?.trim()}"`);
  }

  // Try clicking the avatar trigger
  const avatarButton = page.locator("header button.rounded-full").first();
  const isVis = await avatarButton.isVisible();
  console.log("AVATAR VISIBLE:", isVis);

  if (isVis) {
    await avatarButton.click();
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: "e2e/screenshots/debug-dropdown-open.png" });

    // Check for dropdown content
    const menuItems = page.getByRole("menuitem");
    const menuCount = await menuItems.count();
    console.log("MENU ITEMS:", menuCount);
    for (let i = 0; i < menuCount; i++) {
      console.log(`  MenuItem ${i}: "${await menuItems.nth(i).textContent()}"`);
    }
  }
});
