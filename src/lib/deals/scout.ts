import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { addDaysToDateStr, SPECIAL_LIFETIME_DAYS } from "@/lib/specials";
import { RECHECK_NOTHING_DAYS, RECONFIRM_WINDOW_DAYS } from "./pipeline";

/**
 * The nightly deals scout (git-as-bus, beside the deals review):
 *   todo()  → the venues to look at tonight: live deals lapsing with no email to
 *             ask (recheck their source), then never-checked venues, central areas
 *             first, then venues whose recheck date has come.
 *   apply() → what the routine found. A found special is always stored HIDDEN,
 *             never published: web text is untrusted, and a deal goes live only
 *             once the venue confirms it (or an admin publishes it by hand).
 */
export const SCOUT_PER_NIGHT = 40;
/** Recheck a venue that has a special on file after this many days. */
export const RECHECK_FOUND_DAYS = 30;

/** Walked first: where most readers are, and where Ben is on foot. */
const CENTRAL = ["Ubud centre", "Ubud town", "Padangtegal", "Ubud north (Jl. Suweta)", "Tebesaya", "Pengosekan", "Peliatan", "Penestanan", "Campuhan", "Nyuh Kuning", "Sanggingan"];

type VenueRow = {
  id: string;
  name: string;
  area: string | null;
  category: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  researched_at: string | null;
  next_check_on: string | null;
  closed_at: string | null;
};

export type ScoutTodoItem = Omit<VenueRow, "researched_at" | "next_check_on" | "closed_at"> & {
  reason: "reconfirm" | "first_check" | "recheck";
  /** For reconfirm: the live deals to look for on the venue's own pages. */
  live?: { special_id: string; title: string; source_url: string | null }[];
};

const VENUE_COLS = "id, name, area, category, website_url, instagram_handle, google_maps_url, lat, lng, researched_at, next_check_on, closed_at";

export async function todo(limit = SCOUT_PER_NIGHT, now: Date = new Date()): Promise<ScoutTodoItem[]> {
  const supabase = createAdminClient();
  const today = nowInBali(now).dateStr;
  const soon = addDaysToDateStr(today, RECONFIRM_WINDOW_DAYS);
  const pick = (v: VenueRow) => ({
    id: v.id,
    name: v.name,
    area: v.area,
    category: v.category,
    website_url: v.website_url,
    instagram_handle: v.instagram_handle,
    google_maps_url: v.google_maps_url,
    lat: v.lat,
    lng: v.lng,
  });
  const out: ScoutTodoItem[] = [];
  const taken = new Set<string>();

  // 1. Live deals about to lapse whose venue we can't email: check their own page again.
  const { data: lapsing } = await supabase
    .from("specials")
    .select("id, title, source_url, venue_id, contact_email")
    .eq("status", "live")
    .lte("expires_on", soon)
    .is("contact_email", null)
    .not("venue_id", "is", null);
  const byVenue = new Map<string, { special_id: string; title: string; source_url: string | null }[]>();
  for (const s of lapsing ?? []) {
    byVenue.set(s.venue_id, [...(byVenue.get(s.venue_id) ?? []), { special_id: s.id, title: s.title, source_url: s.source_url }]);
  }
  if (byVenue.size) {
    const { data } = await supabase.from("deal_venues").select(VENUE_COLS).in("id", [...byVenue.keys()]);
    for (const v of (data ?? []) as VenueRow[]) {
      out.push({ ...pick(v), reason: "reconfirm", live: byVenue.get(v.id) });
      taken.add(v.id);
    }
  }

  // 2. Never checked, central areas first.
  if (out.length < limit) {
    const { data } = await supabase.from("deal_venues").select(VENUE_COLS).is("researched_at", null).is("closed_at", null).limit(2000);
    const rank = (a: string | null) => (a && CENTRAL.includes(a) ? CENTRAL.indexOf(a) : CENTRAL.length);
    const fresh = ((data ?? []) as VenueRow[])
      .filter((v) => !taken.has(v.id))
      .sort((a, b) => rank(a.area) - rank(b.area) || (a.area ?? "").localeCompare(b.area ?? "") || a.name.localeCompare(b.name));
    for (const v of fresh.slice(0, limit - out.length)) {
      out.push({ ...pick(v), reason: "first_check" });
      taken.add(v.id);
    }
  }

  // 3. Rechecks that have come due, oldest first.
  if (out.length < limit) {
    const { data } = await supabase
      .from("deal_venues")
      .select(VENUE_COLS)
      .lte("next_check_on", today)
      .is("closed_at", null)
      .order("next_check_on")
      .limit(limit);
    for (const v of ((data ?? []) as VenueRow[]).filter((v) => !taken.has(v.id)).slice(0, limit - out.length)) {
      out.push({ ...pick(v), reason: "recheck" });
    }
  }
  return out;
}

const time = z.string().regex(/^\d{2}:\d{2}$/).nullable();
const idr = z.number().int().min(0).max(100_000_000).nullable();
const text = (max: number) => z.string().trim().min(1).max(max);

const foundSpecial = z.object({
  title: text(120),
  description: text(600).nullable(),
  price_idr: idr,
  normal_price_idr: idr,
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  days_stated: z.boolean(),
  start_time: time,
  end_time: time,
  source_url: z.string().url().max(500),
  /** The routine's call on CLAUDE.md "What we list": food/café/wellness, 25%+ below normal, saving nameable. */
  passes_rule: z.boolean(),
  /** One plain line: the saving, or why it fails. */
  reason: text(300),
});

export const findingsSchema = z.object({
  checkedAt: z.string(),
  findings: z
    .array(
      z.object({
        venue_id: z.string().uuid(),
        result: z.enum(["specials", "nothing", "closed", "unreachable"]),
        note: text(500),
        specials: z.array(foundSpecial).max(10).default([]),
        /** Public ways to reach the venue, each with where it was found. Never guessed. */
        contact: z
          .object({
            email: z.string().email().max(200).nullable(),
            email_source_url: z.string().url().max(500).nullable(),
            instagram_handle: z.string().regex(/^[A-Za-z0-9_.]{1,30}$/).nullable(),
            contact_name: z.string().trim().max(80).nullable(),
            contact_name_source_url: z.string().url().max(500).nullable(),
            website_url: z.string().url().max(500).nullable(),
          })
          .partial()
          .optional(),
        /** For reconfirm items: is each live deal still on the venue's own page? */
        renew: z.array(z.object({ special_id: z.string().uuid(), still_running: z.boolean(), source_url: z.string().url().max(500).nullable() })).max(10).default([]),
      })
    )
    .max(100),
});
export type Findings = z.infer<typeof findingsSchema>;

export const NOTE_FOUND_PASSES = "Found by our check of your public pages. We'll list it once you confirm it's still running.";
export const NOTE_FOUND_FAILS = "Not listed: we list food, café and wellness deals at least 25% below your normal price. Add your normal price and we'll look again.";
export const NOTE_NOT_RUNNING = "Taken down: we couldn't find this offer on your pages any more. Add it again if it's still running.";

export type ScoutReport = { venues: number; contactsAdded: number; specialsAdded: number; duplicates: number; closed: number; renewed: number; takenDown: number; unknownVenues: number };

export async function apply(input: Findings, now: Date = new Date()): Promise<ScoutReport> {
  const supabase = createAdminClient();
  const today = nowInBali(now).dateStr;
  const report: ScoutReport = { venues: 0, contactsAdded: 0, specialsAdded: 0, duplicates: 0, closed: 0, renewed: 0, takenDown: 0, unknownVenues: 0 };

  for (const f of input.findings) {
    const { data: venue } = await supabase
      .from("deal_venues")
      .select("id, name, area, website_url, instagram_handle, contact_email, contact_name")
      .eq("id", f.venue_id)
      .maybeSingle();
    if (!venue) {
      report.unknownVenues += 1;
      continue;
    }
    report.venues += 1;
    const nextDays = f.result === "specials" ? RECHECK_FOUND_DAYS : f.result === "unreachable" ? 14 : RECHECK_NOTHING_DAYS;
    await supabase
      .from("deal_venues")
      .update({
        researched_at: now.toISOString(),
        research_notes: { date: today, result: f.result, note: f.note },
        next_check_on: f.result === "closed" ? null : addDaysToDateStr(today, nextDays),
        closed_at: f.result === "closed" ? now.toISOString() : null,
        updated_at: now.toISOString(),
      })
      .eq("id", venue.id);
    if (f.result === "closed") report.closed += 1;

    // Fill in contacts we don't have yet; never overwrite one we (or the venue) already set.
    const c = f.contact ?? {};
    const fill: Record<string, string> = {};
    if (c.email && c.email_source_url && !venue.contact_email) Object.assign(fill, { contact_email: c.email.toLowerCase(), contact_source_url: c.email_source_url });
    if (c.contact_name && c.contact_name_source_url && !venue.contact_name) fill.contact_name = c.contact_name;
    if (c.instagram_handle && !venue.instagram_handle) fill.instagram_handle = c.instagram_handle;
    if (c.website_url && !venue.website_url) fill.website_url = c.website_url;
    if (Object.keys(fill).length) {
      await supabase.from("deal_venues").update(fill).eq("id", venue.id);
      report.contactsAdded += 1;
    }

    // Keep every special found, listed or not; skip one already on file under the same title.
    const { data: existing } = await supabase.from("specials").select("title").eq("venue_id", venue.id);
    const titles = new Set((existing ?? []).map((s) => s.title.toLowerCase()));
    for (const s of f.specials) {
      if (titles.has(s.title.toLowerCase())) {
        report.duplicates += 1;
        continue;
      }
      titles.add(s.title.toLowerCase());
      const { error } = await supabase.from("specials").insert({
        venue_id: venue.id,
        venue_name: venue.name,
        venue_area: venue.area,
        website_url: venue.website_url,
        instagram_handle: venue.instagram_handle,
        title: s.title,
        description: s.description,
        price_idr: s.price_idr,
        normal_price_idr: s.normal_price_idr,
        weekdays: s.weekdays,
        days_stated: s.days_stated,
        start_time: s.start_time,
        end_time: s.end_time,
        status: "hidden",
        source: "scout",
        source_url: s.source_url,
        review_note: s.passes_rule ? NOTE_FOUND_PASSES : NOTE_FOUND_FAILS,
        research_note: s.reason,
        reviewed_at: now.toISOString(),
      });
      if (!error) report.specialsAdded += 1;
    }

    // Reconfirm by source: still on their own page renews 30 days; gone comes down.
    for (const r of f.renew) {
      const { data: sp } = await supabase.from("specials").select("id, venue_id, status").eq("id", r.special_id).maybeSingle();
      if (!sp || sp.venue_id !== venue.id || sp.status !== "live") continue;
      if (r.still_running) {
        await supabase
          .from("specials")
          .update({ confirmed_at: now.toISOString(), expires_on: addDaysToDateStr(today, SPECIAL_LIFETIME_DAYS), source_url: r.source_url ?? undefined, updated_at: now.toISOString() })
          .eq("id", sp.id);
        report.renewed += 1;
      } else {
        await supabase.from("specials").update({ status: "hidden", review_note: NOTE_NOT_RUNNING, updated_at: now.toISOString() }).eq("id", sp.id);
        report.takenDown += 1;
      }
    }
  }
  return report;
}
