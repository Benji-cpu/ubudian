import { type Page, expect } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.resolve(__dirname, "../screenshots");

// Known slugs from seed.sql for detail page testing
export const SEEDED_SLUGS = {
  stories: [
    "wayan-sukerta-mask-carver-mas-village",
    "sarah-chen-silicon-valley-sacred-breath",
    "kadek-ariani-farming-future-tegallalang",
    "marco-rossi-tuscany-meets-tropics",
    "ni-luh-putu-eka-yoga-teacher-stayed-home",
  ],
  events: [
    "full-moon-sound-healing-march-2026",
    "ubud-open-mic-night-march-2026",
    "balinese-painting-workshop-arma",
    "jazz-night-bridges-bali",
    "sunrise-yoga-campuhan-ridge",
    "ubud-organic-farmers-market",
    "film-night-paradiso-act-of-killing",
    "raw-food-masterclass-alchemy",
    "ogoh-ogoh-parade-nyepi-eve-2026",
    "community-river-cleanup-wos-river",
  ],
  tours: [
    "sacred-water-temples-rice-terraces",
    "ubud-food-trail",
    "campuhan-sayan-artists-ridge-walk",
    "hidden-waterfalls-jungle-trek",
    "ubud-heritage-walk",
  ],
  newsletter: ["weekly-mask-carvers-secret", "weekly-nyepi-is-coming"],
  quiz_archetypes: [
    "seeker",
    "explorer",
    "creative",
    "connector",
    "epicurean",
  ],
} as const;

/**
 * Determine viewport label from the test project name.
 */
function getViewportLabel(page: Page): "desktop" | "mobile" {
  const viewport = page.viewportSize();
  return viewport && viewport.width <= 500 ? "mobile" : "desktop";
}

/**
 * Take a full-page screenshot saved to e2e/screenshots/{desktop|mobile}/{name}.png
 */
export async function auditScreenshot(page: Page, name: string) {
  const label = getViewportLabel(page);
  const filePath = path.join(SCREENSHOT_DIR, label, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
}

/**
 * Wait for the page to be reasonably settled.
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
    // networkidle may not fire on long-polling pages — fall back to domcontentloaded
  });
  // Give animations a moment to settle
  await page.waitForTimeout(500);
}

/**
 * Check that no content overflows horizontally beyond the viewport.
 * Returns an array of selectors that overflow.
 */
export async function checkNoHorizontalOverflow(page: Page): Promise<string[]> {
  const overflowing = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const results: string[] = [];
    const elements = document.querySelectorAll("body *");
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 2) {
        // Build a readable selector
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const cls = el.className && typeof el.className === "string"
          ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
          : "";
        results.push(`${tag}${id}${cls} (right: ${Math.round(rect.right)}px)`);
      }
    });
    return results;
  });
  return overflowing;
}

/**
 * Find interactive elements that are smaller than the WCAG 44x44px minimum.
 * Returns descriptions of undersized elements.
 */
export async function checkTouchTargets(page: Page): Promise<string[]> {
  const undersized = await page.evaluate(() => {
    const MIN_SIZE = 44;
    const results: string[] = [];
    const interactiveSelectors = "a, button, input, select, textarea, [role='button'], [tabindex]";
    const elements = document.querySelectorAll(interactiveSelectors);
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Skip hidden/off-screen elements
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.top > window.innerHeight * 3) return; // deep off-screen
      if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || "").trim().slice(0, 30);
        results.push(
          `${tag} "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)}px)`
        );
      }
    });
    return results;
  });
  return undersized;
}

/**
 * Find text elements smaller than 14px on mobile.
 * Returns descriptions of too-small text.
 */
export async function checkTextReadability(page: Page): Promise<string[]> {
  const tooSmall = await page.evaluate(() => {
    const MIN_FONT = 14;
    const results: string[] = [];
    const textElements = document.querySelectorAll(
      "p, span, a, li, td, th, label, h1, h2, h3, h4, h5, h6, div"
    );
    textElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      // Only flag elements that actually contain direct text
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
      );
      if (!hasDirectText) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (fontSize < MIN_FONT) {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || "").trim().slice(0, 30);
        results.push(`${tag} "${text}" (${fontSize}px)`);
      }
    });
    return results;
  });
  return tooSmall;
}

/**
 * Check for broken or unloaded images.
 * Returns descriptions of problem images.
 */
export async function checkImagesLoaded(page: Page): Promise<string[]> {
  const broken = await page.evaluate(() => {
    const results: string[] = [];
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.complete || img.naturalWidth === 0) {
        const src = img.src || img.getAttribute("data-src") || "(no src)";
        const alt = img.alt || "(no alt)";
        results.push(`"${alt}" — ${src.slice(0, 80)}`);
      }
    });
    return results;
  });
  return broken;
}

/**
 * Capture any console errors that occurred during the page load.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

export interface AuditResult {
  horizontalOverflow: string[];
  undersizedTouchTargets: string[];
  smallText: string[];
  brokenImages: string[];
  consoleErrors: string[];
}

/**
 * Run all standard audit checks on the current page and take a screenshot.
 */
export async function runStandardChecks(
  page: Page,
  name: string
): Promise<AuditResult> {
  await waitForPageReady(page);
  await auditScreenshot(page, name);

  const [horizontalOverflow, undersizedTouchTargets, smallText, brokenImages] =
    await Promise.all([
      checkNoHorizontalOverflow(page),
      checkTouchTargets(page),
      checkTextReadability(page),
      checkImagesLoaded(page),
    ]);

  return {
    horizontalOverflow,
    undersizedTouchTargets,
    smallText,
    brokenImages,
    consoleErrors: [], // caller should attach from collectConsoleErrors
  };
}
