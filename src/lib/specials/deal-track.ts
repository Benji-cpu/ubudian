/**
 * The deal page counter, shared by the page's tracker (browser) and the
 * track route (server). Nothing here touches the database, so the client
 * component can import it.
 *
 * A row in `deal_page_events` is a venue slug, a kind and a time: no IP, user
 * agent, referrer, cookie id or user id.
 */

export const DEAL_EVENT_KINDS = ["view", "map", "website", "instagram", "share", "book"] as const;
export type DealEventKind = (typeof DEAL_EVENT_KINDS)[number];

/** Every kind but `view`: a reader acting on the deal. */
export const DEAL_TAP_KINDS = DEAL_EVENT_KINDS.filter((k) => k !== "view") as Exclude<DealEventKind, "view">[];

/** The attribute that marks a link or button on the deal page as a tap to count: `data-deal-track="map"`. */
export const DEAL_TRACK_ATTR = "data-deal-track";

/** `localStorage.ubu_nocount === "1"` turns counting off in this browser. Set by visiting any page with `?nocount=1`. */
export const NO_COUNT_KEY = "ubu_nocount";

export const DEAL_TRACK_PATH = "/api/deals/track";

/**
 * Browser only. True when this browser has opted out of the counter. A page
 * opened with `?nocount=1` sets the key first, so our own checks never count.
 */
export function countingOff(): boolean {
  let urlOff = false;
  try {
    urlOff = new URLSearchParams(window.location.search).get("nocount") === "1";
    if (urlOff) window.localStorage.setItem(NO_COUNT_KEY, "1");
    return urlOff || window.localStorage.getItem(NO_COUNT_KEY) === "1";
  } catch {
    // Storage blocked: the URL still decides for this page.
    return urlOff;
  }
}
