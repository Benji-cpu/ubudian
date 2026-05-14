/**
 * Dark-mode contrast grader.
 *
 * Walks the rubric page list (see docs/design/dark-mode-rubric.md) in both
 * themes, captures a screenshot pair per route, and runs axe-core filtered to
 * `color-contrast` rules. The events page (the one this rubric was written
 * against) is a hard-fail. Other pages are logged-only so we can ratchet down
 * as components migrate to semantic tokens.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "path";

const SCREENSHOT_DIR = path.resolve(__dirname, "../screenshots");

const HARD_FAIL_ROUTES = new Set<string>([
  "/events",
]);

const ROUTES: { path: string; name: string }[] = [
  { path: "/", name: "home" },
  { path: "/events", name: "events" },
  { path: "/events/full-moon-sound-healing-march-2026", name: "event-detail" },
  { path: "/experiences", name: "experiences" },
  { path: "/guides", name: "guides" },
  { path: "/stories", name: "stories" },
  { path: "/blog", name: "blog" },
  { path: "/about", name: "about" },
  { path: "/quiz", name: "quiz" },
];

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* localStorage may be unavailable in some sandboxed contexts */
    }
  }, theme);
}

async function ensureThemeApplied(page: Page, theme: "light" | "dark") {
  // next-themes runs an inline script before hydration; the .dark class
  // should be on <html> by the time the page is interactive. Wait briefly
  // to catch hydration laggers.
  await page.waitForFunction(
    (t) => {
      const isDark = document.documentElement.classList.contains("dark");
      return t === "dark" ? isDark : !isDark;
    },
    theme,
    { timeout: 4000 },
  ).catch(() => {
    /* ignore — axe + screenshot will show the truth */
  });
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`Dark-mode rubric — ${theme}`, () => {
    for (const route of ROUTES) {
      test(`${route.name} (${theme})`, async ({ page }) => {
        await setTheme(page, theme);

        const response = await page.goto(route.path);
        expect(
          response?.status(),
          `${route.path} returned ${response?.status()}`,
        ).toBeLessThan(400);

        await ensureThemeApplied(page, theme);
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(400);

        const screenshotPath = path.join(
          SCREENSHOT_DIR,
          theme,
          `${route.name}.png`,
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const results = await new AxeBuilder({ page })
          .withRules(["color-contrast"])
          .analyze();

        const violations = results.violations.filter(
          (v) => v.id === "color-contrast",
        );

        if (violations.length > 0) {
          const formatted = violations
            .flatMap((v) =>
              v.nodes.map((n) => ({
                impact: v.impact,
                html: n.html.slice(0, 200),
                target: n.target.join(" "),
                failure: n.failureSummary?.split("\n").slice(0, 3).join(" · "),
              })),
            )
            .slice(0, 20);
          console.log(
            `\n[dark-mode rubric] ${route.path} (${theme}) — ${violations.flatMap((v) => v.nodes).length} contrast violation(s):`,
          );
          console.table(formatted);
        }

        if (HARD_FAIL_ROUTES.has(route.path)) {
          expect(
            violations,
            `${route.path} (${theme}) must have zero color-contrast violations — this is a rubric-protected page`,
          ).toEqual([]);
        }
      });
    }
  });
}
