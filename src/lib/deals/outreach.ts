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
      ? `We have listed your ${deal} on the site, free. Do you have any other deals?`
      : `We saw your ${deal} and would like to list it. Is it still available? Do you have any other deals?`
    : "Do you have a deal for guests? For example 25% or more off a meal or a wellness session. Food and wellness only, not drinks.";
  return [
    `Hi ${shortName(v.name)} team! This is The Ubudian (theubudian.life), a website that shows Ubud's food and wellness deals to locals and visitors.`,
    ask,
    `Listing is free, with no commission. You can add your deal here: theubudian.life/v/${v.invite_token} (or just reply here).`,
    "Not interested? Just say so and we won't message again.",
  ].join(" ");
}

/** Venues for walk-in cards in one area: not reachable by email or Instagram, not contacted yet. */
export async function cardVenues(area: string): Promise<OutreachVenue[]> {
  const { data } = await uncontacted().is("instagram_handle", null).eq("area", area).order("name").returns<OutreachVenue[]>();
  return (data ?? []).filter((v) => !SKIP.test(v.name));
}

/** The same cards for a hand-picked walk (the walk-in kit's clusters), by venue id. */
export async function cardVenuesByIds(ids: string[]): Promise<OutreachVenue[]> {
  const { data } = await uncontacted().in("id", ids).order("name").returns<OutreachVenue[]>();
  return data ?? [];
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
