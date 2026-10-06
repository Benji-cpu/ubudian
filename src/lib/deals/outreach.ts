import { createAdminClient } from "@/lib/supabase/admin";
import { NOTE_FOUND_PASSES } from "./scout";

/**
 * The hand-sent half of venue outreach (Code/handovers/2026-10-06-deals-outreach-plan.md):
 * Instagram DMs Ben sends from his own account, and printed walk-in cards. Email goes out
 * from a separate script. One channel per venue: a venue with an email isn't DM'd, and a
 * venue already contacted (or opted out) is in neither list. The point of every message
 * is to learn what deals the venue runs; a deal we already know is only the opener.
 */
export const IG_PER_DAY = 15;

/** Resorts and fine dining, cut by the Reviewer on 6 Oct: unlikely to run a 25% deal. */
const SKIP = /viceroy|cascades|ap[ée]ritif|kayon|kepitu|k club|kraton|locavore|wedja|sayan valley|como|mandapa|four seasons/i;
/** Path words from a pasted Instagram link, not a venue's handle (The Chowk's OSM tag was "profilecard"). */
const JUNK_HANDLE = /^(profilecard|p|explore|reel|reels|stories|accounts|share)$/i;
const CENTRAL = ["Ubud centre", "Ubud town", "Padangtegal", "Ubud north (Jl. Suweta)", "Tebesaya", "Pengosekan", "Peliatan", "Penestanan", "Campuhan", "Nyuh Kuning", "Sanggingan"];
const rank = (a: string | null) => (a && CENTRAL.includes(a) ? CENTRAL.indexOf(a) : CENTRAL.length);

export type OutreachVenue = {
  id: string;
  name: string;
  area: string | null;
  category: string | null;
  instagram_handle: string | null;
  invite_token: string;
};

const COLS = "id, name, area, category, instagram_handle, invite_token";
const titleCase = (n: string) => (n === n.toLowerCase() ? n.replace(/\b\w/g, (c) => c.toUpperCase()) : n);
/** "Gelato Secrets (Ubud centre)" → "Gelato Secrets": the area suffix is ours, not their name. */
export const shortName = (n: string) => titleCase(n).replace(/\s*\([^)]*\)\s*$/, "").trim();

function uncontacted() {
  return createAdminClient()
    .from("deal_venues")
    .select(COLS)
    .is("last_contacted_at", null)
    .is("opted_out_at", null)
    .is("closed_at", null)
    .is("contact_email", null);
}

export async function instagramQueue(limit = IG_PER_DAY): Promise<(OutreachVenue & { text: string })[]> {
  const { data } = await uncontacted().not("instagram_handle", "is", null).returns<OutreachVenue[]>();
  const picked = (data ?? [])
    .filter((v) => !SKIP.test(v.name) && !JUNK_HANDLE.test(v.instagram_handle ?? ""))
    .sort((a, b) => rank(a.area) - rank(b.area) || a.name.localeCompare(b.name))
    .slice(0, limit);
  if (!picked.length) return [];
  const { data: deals } = await createAdminClient()
    .from("specials")
    .select("venue_id, title, status, review_note")
    .in("venue_id", picked.map((v) => v.id));
  return picked.map((v) => {
    const own = (deals ?? []).filter((d) => d.venue_id === v.id);
    const known = own.find((d) => d.status === "live") ?? own.find((d) => d.status === "hidden" && d.review_note === NOTE_FOUND_PASSES);
    return { ...v, text: dmText(v, known?.title ?? null, known?.status === "live") };
  });
}

export function dmText(v: Pick<OutreachVenue, "name" | "invite_token">, knownTitle: string | null, isLive: boolean): string {
  const deal = knownTitle ? knownTitle.charAt(0).toLowerCase() + knownTitle.slice(1) : null;
  const ask = deal
    ? isLive
      ? `I've listed your ${deal} for free. Do you run any other deals or specials?`
      : `I saw your ${deal} and would love to list it. Is it still on, and do you run anything else?`
    : "Do you run any deals or specials? Something that saves guests 25% or more on food, café or wellness (no drinks).";
  return [
    `Hi ${shortName(v.name)} team! I'm Ben, based in Ubud. I run The Ubudian (theubudian.life), a free website that lists Ubud's food and wellness deals.`,
    ask,
    `Tell me here and I'll list it for free: theubudian.life/v/${v.invite_token} (or just reply).`,
    "Not interested? Just say so and I won't message again.",
  ].join(" ");
}

/** Venues for walk-in cards in one area: not reachable by email or Instagram, not contacted yet. */
export async function cardVenues(area: string): Promise<OutreachVenue[]> {
  const { data } = await uncontacted().is("instagram_handle", null).eq("area", area).order("name").returns<OutreachVenue[]>();
  return (data ?? []).filter((v) => !SKIP.test(v.name));
}

export async function markContacted(venueId: string, channel: "instagram" | "in_person") {
  const now = new Date().toISOString();
  await createAdminClient()
    .from("deal_venues")
    .update({ last_contacted_at: now, contact_channel: channel, updated_at: now })
    .eq("id", venueId)
    .is("last_contacted_at", null);
}

export async function markOptedOut(venueId: string) {
  const now = new Date().toISOString();
  await createAdminClient().from("deal_venues").update({ opted_out_at: now, updated_at: now }).eq("id", venueId);
}
