import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { addDaysToDateStr, SPECIAL_LIFETIME_DAYS } from "@/lib/specials";
import { dealColumns, type NewVenueInput, type VenueDealInput } from "./schema";

/** Shown wherever a venue submits or edits. Keep it true: the nightly review publishes most by morning, but a flagged deal waits for an admin and a routine can miss a night, so never promise a fixed time. */
export const REVIEW_PROMISE = "We check new and changed deals every night; most are live by the next morning";

export type DealVenue = {
  id: string;
  name: string;
  area: string | null;
  instagram_handle: string | null;
  owner_user_id: string | null;
};

export type OwnerDeal = {
  id: string;
  title: string;
  description: string | null;
  price_idr: number | null;
  normal_price_idr: number | null;
  weekdays: number[];
  days_stated: boolean;
  start_time: string | null;
  end_time: string | null;
  status: "live" | "hidden" | "pending";
  pending_changes: Record<string, unknown> | null;
  review_note: string | null;
  expires_on: string;
};

const VENUE_COLS = "id, name, area, instagram_handle, owner_user_id";
const OWNER_DEAL_COLS =
  "id, title, description, price_idr, normal_price_idr, weekdays, days_stated, start_time, end_time, status, pending_changes, review_note, expires_on";

export async function getOwnedVenues(userId: string): Promise<DealVenue[]> {
  const { data } = await createAdminClient().from("deal_venues").select(VENUE_COLS).eq("owner_user_id", userId).order("name");
  return (data ?? []) as DealVenue[];
}

/** The venue behind a private confirm link (any of its deals' tokens). */
export async function getVenueByConfirmToken(token: string): Promise<DealVenue | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const supabase = createAdminClient();
  const { data: deal } = await supabase.from("specials").select("venue_id").eq("confirm_token", token).maybeSingle();
  const venueId = (deal as { venue_id: string | null } | null)?.venue_id;
  if (!venueId) return null;
  const { data } = await supabase.from("deal_venues").select(VENUE_COLS).eq("id", venueId).maybeSingle();
  return (data as DealVenue) ?? null;
}

export type ClaimResult = { ok: true; venue: DealVenue } | { ok: false; reason: "invalid" | "taken" };

/** Bind a venue to the signed-in owner. The emailed link proves the inbox; first claim wins. */
export async function claimVenue(token: string, userId: string): Promise<ClaimResult> {
  const venue = await getVenueByConfirmToken(token);
  if (!venue) return { ok: false, reason: "invalid" };
  if (venue.owner_user_id === userId) return { ok: true, venue };
  if (venue.owner_user_id) return { ok: false, reason: "taken" };
  const { data, error } = await createAdminClient()
    .from("deal_venues")
    .update({ owner_user_id: userId, claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", venue.id)
    .is("owner_user_id", null)
    .select(VENUE_COLS)
    .maybeSingle();
  if (error || !data) return { ok: false, reason: "taken" };
  return { ok: true, venue: data as DealVenue };
}

/** A venue that isn't listed yet; owned by whoever adds it. */
export async function createVenue(userId: string, v: NewVenueInput): Promise<DealVenue | null> {
  const { data, error } = await createAdminClient()
    .from("deal_venues")
    .insert({
      name: v.venue_name,
      area: v.venue_area || null,
      address: v.venue_address || null,
      instagram_handle: v.instagram_handle ? v.instagram_handle.replace(/^@/, "") : null,
      website_url: v.website_url || null,
      contact_name: v.contact_name,
      contact_phone: v.contact_phone,
      contact_email: v.contact_email ? v.contact_email.toLowerCase() : null,
      owner_user_id: userId,
      claimed_at: new Date().toISOString(),
    })
    .select(VENUE_COLS)
    .maybeSingle();
  if (error) return null; // most likely the name is already listed: claim it instead
  return data as DealVenue;
}

export async function getOwnedVenue(venueId: string, userId: string): Promise<DealVenue | null> {
  const { data } = await createAdminClient()
    .from("deal_venues")
    .select(VENUE_COLS)
    .eq("id", venueId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  return (data as DealVenue) ?? null;
}

export async function listVenueDeals(venueId: string): Promise<OwnerDeal[]> {
  const { data } = await createAdminClient()
    .from("specials")
    .select(OWNER_DEAL_COLS)
    .eq("venue_id", venueId)
    .order("status")
    .order("title");
  return (data ?? []) as OwnerDeal[];
}

/** A new deal from the owner waits for the daily review. */
export async function createVenueDeal(venueId: string, userId: string, d: VenueDealInput) {
  const supabase = createAdminClient();
  const { data: v } = await supabase
    .from("deal_venues")
    .select("name, area, address, website_url, instagram_handle, google_maps_url, contact_name, contact_phone, contact_email")
    .eq("id", venueId)
    .single();
  const venue = v as Record<string, string | null>;
  return supabase.from("specials").insert({
    ...dealColumns(d),
    venue_id: venueId,
    venue_name: venue.name,
    venue_area: venue.area,
    venue_address: venue.address,
    website_url: venue.website_url,
    instagram_handle: venue.instagram_handle,
    google_maps_url: venue.google_maps_url,
    contact_name: venue.contact_name,
    contact_phone: venue.contact_phone,
    contact_email: venue.contact_email,
    status: "pending",
    source: "form",
    submitted_by_user_id: userId,
    expires_on: addDaysToDateStr(nowInBali().dateStr, SPECIAL_LIFETIME_DAYS),
  });
}

/**
 * An owner's edit. A live deal keeps showing while the change waits in
 * `pending_changes`; a pending or hidden one is updated in place and (re)queued.
 */
export async function updateVenueDeal(dealId: string, venueId: string, userId: string, d: VenueDealInput) {
  const supabase = createAdminClient();
  const { data: row } = await supabase.from("specials").select("status").eq("id", dealId).eq("venue_id", venueId).maybeSingle();
  if (!row) return { error: "not_found" as const };
  const now = new Date().toISOString();
  const cols = dealColumns(d);
  const update =
    (row as { status: string }).status === "live"
      ? { pending_changes: cols, submitted_by_user_id: userId, review_note: null, updated_at: now }
      : { ...cols, status: "pending", days_stated: true, pending_changes: null, submitted_by_user_id: userId, review_note: null, updated_at: now };
  const { error } = await supabase.from("specials").update(update).eq("id", dealId).eq("venue_id", venueId);
  return { error: error ? ("db" as const) : null };
}

/** Taking a deal down needs no review: it's hidden at once. */
export async function takeDownVenueDeal(dealId: string, venueId: string) {
  const { error } = await createAdminClient()
    .from("specials")
    .update({ status: "hidden", pending_changes: null, updated_at: new Date().toISOString() })
    .eq("id", dealId)
    .eq("venue_id", venueId);
  return { error: error ? ("db" as const) : null };
}
