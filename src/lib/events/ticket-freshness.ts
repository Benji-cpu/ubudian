/**
 * Ticket-page freshness probing.
 *
 * Some ticketing hosts (Megatix) recycle no-year slugs: `/events/beauty-way-jun`
 * 200s happily while its schema.org JSON-LD reads a startDate from 2024. The LLM
 * parser, seeing only "Beauty Way — Jun", stamps the current year and creates a
 * phantom future event. The page's JSON-LD block carries the *real* date near
 * the top of the document — parse it to catch the year-roll at ingestion, and to
 * flag dead CTAs in the nightly link-health sweep.
 *
 * Keep these regexes in sync with the duplicate set in
 * `src/lib/maintenance/cleanups.ts` (that module runs its own HEAD→GET link
 * health and can't depend on this one's single-GET probe).
 */

// Hosts that serve a healthy 200 for a passed event (slug recycled per edition).
const STALE_PRONE_HOST = /(?:\/\/|\.)megatix\./i;

const JSONLD_START_DATE = /"startdate"\s*:\s*"(\d{4}-\d{2}-\d{2})/i;
const JSONLD_END_DATE = /"enddate"\s*:\s*"(\d{4}-\d{2}-\d{2})/i;

const PROBE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const PROBE_TIMEOUT_MS = 4000;
const PROBE_SCAN_BYTES = 40000;

export function isStaleProneTicketHost(url: string): boolean {
  return STALE_PRONE_HOST.test(url);
}

/** Last calendar day (YYYY-MM-DD) embedded in a ticket page body, or null. */
export function embeddedLastDay(body: string): string | null {
  const low = body.toLowerCase();
  return low.match(JSONLD_END_DATE)?.[1] ?? low.match(JSONLD_START_DATE)?.[1] ?? null;
}

/**
 * Fetch a stale-prone ticket URL and return the real event last-day from its
 * JSON-LD. Returns null when the host isn't stale-prone, the page is unreachable
 * or challenged (403/JS-wall), or no date is embedded. Best-effort: never throws
 * and is hard-bounded by {@link PROBE_TIMEOUT_MS} so it can't hang the pipeline.
 */
export async function fetchTicketLastDay(url: string): Promise<string | null> {
  if (!isStaleProneTicketHost(url)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": PROBE_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (res.status >= 400) return null; // 403 challenge / 5xx — can't verify, don't block
    const body = (await res.text()).slice(0, PROBE_SCAN_BYTES);
    return embeddedLastDay(body);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
