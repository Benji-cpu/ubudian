import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { addDaysToDateStr, SPECIAL_LIFETIME_DAYS } from "@/lib/specials";
import { NOTE_FOUND_PASSES } from "./scout";

/**
 * A venue's private page, /v/<invite_token>, linked from every outreach message
 * (Code/handovers/2026-10-06-deals-outreach-plan.md). Its job is to learn what
 * deals the venue runs: a short form whose answer waits for the nightly review
 * like any venue submission. Deals we already know are shown as the opener.
 */
const UUID = /^[0-9a-f-]{36}$/i;

export type InviteDeal = {
  id: string;
  title: string;
  description: string | null;
  weekdays: number[];
  days_stated: boolean;
  start_time: string | null;
  end_time: string | null;
  price_idr: number | null;
  status: string;
  expires_on: string;
  confirm_token: string;
};

export type Invite = {
  venueId: string;
  name: string;
  area: string | null;
  category: string | null;
  address: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  mapsUrl: string;
  contactName: string | null;
  optedOut: boolean;
  /** Live now: the venue can confirm or change them through the existing reconfirm page. */
  live: InviteDeal[];
  /** Found on the venue's own pages, passes our rule, not listed yet: one tap sends it for listing. */
  found: InviteDeal[];
  /** Sent by the venue, waiting for tonight's review. */
  waiting: InviteDeal[];
};

const DEAL_COLS = "id, title, description, weekdays, days_stated, start_time, end_time, price_idr, status, expires_on, confirm_token, review_note";

export async function getInvite(token: string): Promise<Invite | null> {
  if (!UUID.test(token)) return null;
  const supabase = createAdminClient();
  const { data: v } = await supabase
    .from("deal_venues")
    .select("id, name, area, category, address, website_url, instagram_handle, google_maps_url, lat, lng, contact_name, opted_out_at")
    .eq("invite_token", token)
    .maybeSingle();
  if (!v) return null;
  const { data: deals } = await supabase.from("specials").select(DEAL_COLS).eq("venue_id", v.id);
  const today = nowInBali().dateStr;
  const rows = (deals ?? []) as (InviteDeal & { review_note: string | null })[];
  return {
    venueId: v.id,
    name: v.name,
    area: v.area,
    category: v.category,
    address: v.address,
    websiteUrl: v.website_url,
    instagramHandle: v.instagram_handle?.replace(/^@/, "") || null,
    mapsUrl:
      v.google_maps_url ??
      (v.lat != null && v.lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([v.name, v.address || v.area, "Ubud"].filter(Boolean).join(", "))}`),
    contactName: v.contact_name,
    optedOut: !!v.opted_out_at,
    live: rows.filter((d) => d.status === "live" && d.expires_on >= today),
    found: rows.filter((d) => d.status === "hidden" && d.review_note === NOTE_FOUND_PASSES),
    waiting: rows.filter((d) => d.status === "pending"),
  };
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const NO_LINKS = (v: string | undefined) => !v || !/(https?:\/\/|www\.|\.(com|net|io|ru|xyz)\b)/i.test(v);

export const inviteActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("deal"),
    title: z.string().trim().min(3, "Say what the deal is").max(80).refine(NO_LINKS, "No links, please"),
    details: z.string().trim().max(300).refine(NO_LINKS, "No links, please").optional().or(z.literal("")),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    start_time: z.string().regex(TIME, "Use HH:MM").optional().or(z.literal("")),
    end_time: z.string().regex(TIME, "Use HH:MM").optional().or(z.literal("")),
    price_idr: z.number().int().min(0).max(10_000_000).nullable().optional(),
    normal_price_idr: z.number().int().min(0).max(10_000_000).nullable().optional(),
    contact_name: z.string().trim().max(80).optional().or(z.literal("")),
    contact_phone: z.string().trim().max(30).optional().or(z.literal("")),
    website: z.string().optional().or(z.literal("")), // honeypot
  }),
  z.object({ action: z.literal("yes"), special_id: z.string().uuid() }),
  z.object({ action: z.literal("optout") }),
]);
export type InviteAction = z.infer<typeof inviteActionSchema>;

export type InviteResult = { ok: true } | { ok: false; error: string; status: number };

export async function actOnInvite(token: string, a: InviteAction): Promise<InviteResult> {
  const invite = await getInvite(token);
  if (!invite) return { ok: false, error: "This link doesn't work any more.", status: 404 };
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (a.action === "optout") {
    await supabase.from("deal_venues").update({ opted_out_at: now, updated_at: now }).eq("id", invite.venueId);
    return { ok: true };
  }

  if (a.action === "yes") {
    // A found deal the venue says is on: it goes to tonight's review, now confirmed by the venue.
    const deal = invite.found.find((d) => d.id === a.special_id);
    if (!deal) return { ok: false, error: "That deal isn't on this page.", status: 400 };
    await supabase
      .from("specials")
      .update({ status: "pending", source: "form", review_note: null, confirmed_at: now, updated_at: now })
      .eq("id", deal.id);
    return { ok: true };
  }

  if (a.website) return { ok: true }; // honeypot: pretend it worked
  const { data: venue } = await supabase
    .from("deal_venues")
    .select("name, area, address, website_url, instagram_handle")
    .eq("id", invite.venueId)
    .maybeSingle();
  if (!venue) return { ok: false, error: "This link doesn't work any more.", status: 404 };
  const { error } = await supabase.from("specials").insert({
    venue_id: invite.venueId,
    venue_name: venue.name,
    venue_area: venue.area,
    venue_address: venue.address,
    website_url: venue.website_url,
    instagram_handle: venue.instagram_handle,
    title: a.title,
    description: a.details || null,
    weekdays: [...new Set(a.weekdays)].sort((x, y) => x - y),
    // The form says "no days picked = every day", so the days are always stated.
    days_stated: true,
    start_time: a.start_time || null,
    end_time: a.end_time || null,
    price_idr: a.price_idr ?? null,
    normal_price_idr: a.normal_price_idr ?? null,
    status: "pending",
    source: "form",
    contact_name: a.contact_name || null,
    contact_phone: a.contact_phone || null,
    expires_on: addDaysToDateStr(nowInBali().dateStr, SPECIAL_LIFETIME_DAYS),
  });
  if (error) {
    console.error("Invite deal error:", error.message);
    return { ok: false, error: "Couldn't save it. Please try again, or WhatsApp us.", status: 500 };
  }
  return { ok: true };
}
