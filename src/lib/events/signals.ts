import { createHash } from "crypto";

/** Crawlers, link unfurlers, headless browsers (our Playwright runs included). */
export const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|playwright|lighthouse|curl|wget|python|node-fetch|axios/i;

export function ipHash(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`ubudian-signal:${ip}`).digest("hex").slice(0, 32);
}

const HANDLE_RE = /(?:^|[\s(])@([a-z0-9._]{2,30})\b/gi;
const IG_URL_RE = /instagram\.com\/([a-z0-9._]{2,30})/gi;
const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/gi;

/**
 * Pull the only parts of a reader's suggestion the routine may see: Instagram
 * handles and plain links. Free text never leaves the site, so it can't carry
 * instructions to the routine.
 */
export function extractSuggestion(body: string): { handles: string[]; urls: string[] } {
  const handles = new Set<string>();
  for (const m of body.matchAll(HANDLE_RE)) handles.add(m[1].toLowerCase().replace(/\.$/, ""));
  for (const m of body.matchAll(IG_URL_RE)) {
    const h = m[1].toLowerCase().replace(/\.$/, "");
    if (!["p", "reel", "reels", "stories", "explore"].includes(h)) handles.add(h);
  }
  const urls = new Set<string>();
  for (const m of body.matchAll(URL_RE)) {
    if (!/instagram\.com/i.test(m[0]) && m[0].length <= 300) urls.add(m[0]);
  }
  // A bare word like "yogabarnbali" is a handle too when it's the whole message.
  const bare = body.trim();
  if (!handles.size && !urls.size && /^[a-z0-9._]{3,30}$/i.test(bare)) handles.add(bare.toLowerCase());
  return { handles: [...handles].slice(0, 5), urls: [...urls].slice(0, 3) };
}
