import { HUBS } from "@/lib/hubs";
import { venuePath } from "@/lib/specials/deal-page";

/**
 * IndexNow: tell Bing, Yandex, Seznam, Naver and the engines that share their
 * feed which of our pages just changed, so they recrawl in hours rather than
 * weeks. No account: the key file `public/<key>.txt` (its content is the key)
 * proves we own the host. https://www.indexnow.org/documentation
 *
 * A ping is a courtesy, never a step anything depends on: `pingIndexNow`
 * never throws, and it only sends from production, so a local run or a test
 * of the caller doesn't announce anything.
 */
export const INDEXNOW_KEY = "b32b73817a36c275cda09c9bd94cb016";
export const INDEXNOW_HOST = "theubudian.life";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const ORIGIN = `https://${INDEXNOW_HOST}`;
/** IndexNow takes up to 10,000 URLs per POST. */
const MAX_URLS = 10_000;

export interface IndexNowResult {
  /** IndexNow's HTTP status: 200 or 202 means accepted. Null when nothing was sent or the request failed. */
  status: number | null;
  urls: number;
  /** Why nothing was sent. */
  skipped?: string;
  error?: string;
}

/** Each path (or full URL on our host) once, as an absolute theubudian.life URL. Anything off our host is dropped. */
export function indexNowUrls(paths: string[]): string[] {
  const out = new Set<string>();
  for (const p of paths) {
    let url: URL;
    try {
      url = new URL(p, ORIGIN);
    } catch {
      continue;
    }
    if (url.host !== INDEXNOW_HOST) continue;
    url.protocol = "https:";
    url.hash = "";
    out.add(url.toString());
  }
  return [...out].slice(0, MAX_URLS);
}

/** The POST body IndexNow expects. */
export function indexNowBody(urls: string[]) {
  return { host: INDEXNOW_HOST, key: INDEXNOW_KEY, keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: urls };
}

/** Pages that change when the event listings do: /events, the two timetable pages and every practice hub. */
export function eventListingPaths(): string[] {
  return ["/events", "/ubud-tonight", "/ubud-events-this-week", ...HUBS.map((h) => `/${h.slug}`)];
}

/** Pages that change when a venue's deal does: /deals and each venue's own page. */
export function dealPaths(venueNames: string[]): string[] {
  return ["/deals", ...venueNames.map(venuePath).filter((p): p is string => p !== null)];
}

/**
 * POST the changed pages to IndexNow and log the status. Never throws: a
 * failed ping returns `{ status: null, error }` and the caller carries on.
 * Sends only when `VERCEL_ENV` is `production`, unless `force` (the manual
 * script, `scripts/indexnow-ping.ts`).
 */
export async function pingIndexNow(
  paths: string[],
  opts: { label?: string; force?: boolean; timeoutMs?: number; fetchImpl?: typeof fetch } = {}
): Promise<IndexNowResult> {
  const label = opts.label ?? "ping";
  const urls = indexNowUrls(paths);
  if (urls.length === 0) return { status: null, urls: 0, skipped: "no urls" };
  if (!opts.force && process.env.VERCEL_ENV !== "production") return { status: null, urls: urls.length, skipped: "not production" };
  try {
    const res = await (opts.fetchImpl ?? fetch)(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowBody(urls)),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5_000),
    });
    const accepted = res.status === 200 || res.status === 202;
    const detail = accepted ? "" : (await res.text().catch(() => "")).trim().slice(0, 200);
    console.log(`[indexnow] ${label}: HTTP ${res.status} for ${urls.length} URLs${detail ? ` (${detail})` : ""}`);
    return { status: res.status, urls: urls.length, ...(accepted ? {} : { error: detail || `HTTP ${res.status}` }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[indexnow] ${label}: failed, ${message}`);
    return { status: null, urls: urls.length, error: message };
  }
}
