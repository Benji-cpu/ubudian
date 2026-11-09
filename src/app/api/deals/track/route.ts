/**
 * POST /api/deals/track — the deal page counter. `{ slug, kind, specialId? }`
 * from the tracker on /deals/[slug]: one `view` per venue per browser session,
 * or a tap on the page's map, website, Instagram, share or booking link.
 *
 * Stores the venue slug, the kind and the time, nothing else: the user agent
 * is read to drop bots and never kept, and the IP only keys the in-memory
 * rate limit. Writes only for a venue with a live deal, so a junk slug can't
 * fill the table.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { dealTrackSchema, isBotUserAgent, type DealTrack } from "@/lib/specials/deal-counts";
import { dealsForVenue } from "@/lib/specials/deal-page";
import { getLiveSpecials } from "@/lib/specials/queries";

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  if (isBotUserAgent(request.headers.get("user-agent"))) return noContent();

  let body: DealTrack;
  try {
    body = dealTrackSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ data: null, error: "Invalid event" }, { status: 400 });
  }

  if (!rateLimit(`deal-track:${getClientIp(request)}`, { limit: 120, windowSeconds: 3600 }).success) {
    return NextResponse.json({ data: null, error: "Too many requests" }, { status: 429 });
  }

  const deals = dealsForVenue(await getLiveSpecials(), body.slug);
  if (deals.length === 0) return NextResponse.json({ data: null, error: "Unknown deal page" }, { status: 404 });

  // A deal id from another venue, or one that has lapsed, is dropped rather than stored.
  const specialId = body.specialId && deals.some((d) => d.id === body.specialId) ? body.specialId : null;

  const { error } = await createAdminClient()
    .from("deal_page_events")
    .insert({ venue_slug: body.slug, kind: body.kind, special_id: specialId });
  if (error) {
    console.error("deal track:", error.message);
    return NextResponse.json({ data: null, error: "Could not save" }, { status: 500 });
  }
  return noContent();
}
