import sharp from "sharp";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "brand");
mkdirSync(OUT_DIR, { recursive: true });

const GREEN = "#2C4A3E";
const GOLD = "#C9A84C";
const CREAM = "#FAF5EC";

// Master SVG — monogram-only mark. Designed at 1024x1024, scales down to 16x16.
// Google's OAuth consent screen renders the app name as text beside the icon,
// so the logo itself is just the brand mark.
const svg = ({ size } = {}) => {
  const s = size;
  const cx = s / 2;
  const cornerR = s * 0.18;

  // Monogram positioning. resvg/sharp interprets `y` as roughly the baseline,
  // so we calibrate so the visual center of the lowercase "u" sits at s/2.
  // Empirically: visual_center ≈ y - 0.18 * fontSize for italic serif lowercase "u".
  const monogramSize = s * 0.66;
  const monogramY = s * 0.5 + monogramSize * 0.18;

  // Hairline rules — top and bottom thirds, generous breathing room.
  const ruleY1 = s * 0.18;
  const ruleY2 = s * 0.82;
  const ruleHalfW = s * 0.16;
  const strokeW = Math.max(1, s * 0.005);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${cornerR}" ry="${cornerR}" fill="${GREEN}"/>
  <line x1="${cx - ruleHalfW}" y1="${ruleY1}" x2="${cx + ruleHalfW}" y2="${ruleY1}"
        stroke="${GOLD}" stroke-width="${strokeW}" stroke-linecap="round" opacity="0.55"/>
  <line x1="${cx - ruleHalfW}" y1="${ruleY2}" x2="${cx + ruleHalfW}" y2="${ruleY2}"
        stroke="${GOLD}" stroke-width="${strokeW}" stroke-linecap="round" opacity="0.55"/>
  <text x="${cx}" y="${monogramY}"
        font-family="Lora, 'EB Garamond', Georgia, 'Times New Roman', serif"
        font-style="italic"
        font-weight="400"
        font-size="${monogramSize}"
        fill="${GOLD}"
        text-anchor="middle">u</text>
</svg>`;
};

// Sizes Google OAuth + iOS + PWA + favicons all expect.
const renders = [
  { name: "logo-1024.png", size: 1024 }, // Google OAuth consent (master, ≥120 required)
  { name: "logo-512.png", size: 512 },   // PWA icon, OG fallback
  { name: "logo-192.png", size: 192 },   // PWA icon
  { name: "apple-touch-icon.png", size: 180 }, // iOS home screen
  { name: "icon-32.png", size: 32 },     // favicon-32
  { name: "icon-16.png", size: 16 },     // favicon-16
];

for (const { name, size } of renders) {
  const out = join(OUT_DIR, name);
  await sharp(Buffer.from(svg({ size })))
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out}`);
}

writeFileSync(join(OUT_DIR, "logo.svg"), svg({ size: 1024 }));
console.log(`wrote ${join(OUT_DIR, "logo.svg")}`);

// OpenGraph / social share image — 1200x630 rectangular composition.
// Monogram square on the left, wordmark + tagline on the right.
const ogSvg = () => {
  const w = 1200;
  const h = 630;
  const markSize = 380;
  const markX = 120;
  const markY = (h - markSize) / 2;
  const cornerR = markSize * 0.18;

  // Monogram inside the mark square — same calibration as the master.
  const monogramSize = markSize * 0.66;
  const monogramCx = markX + markSize / 2;
  const monogramY = markY + markSize / 2 + monogramSize * 0.18;
  const ruleHalfW = markSize * 0.16;
  const ruleY1 = markY + markSize * 0.18;
  const ruleY2 = markY + markSize * 0.82;
  const strokeW = Math.max(1, markSize * 0.005);

  // Wordmark column on the right.
  const textX = markX + markSize + 80;
  const wordmarkY = h / 2 - 10;
  const taglineY = h / 2 + 60;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${GREEN}"/>
  <!-- mark -->
  <rect x="${markX}" y="${markY}" width="${markSize}" height="${markSize}" rx="${cornerR}" ry="${cornerR}" fill="${GREEN}" stroke="${GOLD}" stroke-width="2" opacity="0.95"/>
  <line x1="${monogramCx - ruleHalfW}" y1="${ruleY1}" x2="${monogramCx + ruleHalfW}" y2="${ruleY1}"
        stroke="${GOLD}" stroke-width="${strokeW}" stroke-linecap="round" opacity="0.55"/>
  <line x1="${monogramCx - ruleHalfW}" y1="${ruleY2}" x2="${monogramCx + ruleHalfW}" y2="${ruleY2}"
        stroke="${GOLD}" stroke-width="${strokeW}" stroke-linecap="round" opacity="0.55"/>
  <text x="${monogramCx}" y="${monogramY}"
        font-family="Lora, 'EB Garamond', Georgia, 'Times New Roman', serif"
        font-style="italic"
        font-weight="400"
        font-size="${monogramSize}"
        fill="${GOLD}"
        text-anchor="middle">u</text>
  <!-- wordmark -->
  <text x="${textX}" y="${wordmarkY}"
        font-family="Lora, Georgia, 'Times New Roman', serif"
        font-weight="500"
        font-size="96"
        fill="${GOLD}"
        text-anchor="start">The Ubudian</text>
  <text x="${textX}" y="${taglineY}"
        font-family="'Source Sans 3', 'Helvetica Neue', Arial, sans-serif"
        font-weight="400"
        font-size="28"
        letter-spacing="2"
        fill="${CREAM}"
        text-anchor="start" opacity="0.85">The edgy, transformative heart of Ubud</text>
</svg>`;
};

const ogBuffer = await sharp(Buffer.from(ogSvg()))
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(join(OUT_DIR, "og-image.png"), ogBuffer);
console.log(`wrote ${join(OUT_DIR, "og-image.png")}`);

// Next.js App Router metadata-files convention: opengraph-image.png in app dir
// gets auto-wired as the default og:image. Same file, second location.
const APP_DIR = join(process.cwd(), "src", "app");
writeFileSync(join(APP_DIR, "opengraph-image.png"), ogBuffer);
console.log(`wrote ${join(APP_DIR, "opengraph-image.png")}`);

// Also drop icon.png + apple-icon.png into src/app for Next.js metadata routing.
copyFileSync(join(OUT_DIR, "icon-32.png"), join(APP_DIR, "icon.png"));
console.log(`wrote ${join(APP_DIR, "icon.png")}`);
copyFileSync(join(OUT_DIR, "apple-touch-icon.png"), join(APP_DIR, "apple-icon.png"));
console.log(`wrote ${join(APP_DIR, "apple-icon.png")}`);
