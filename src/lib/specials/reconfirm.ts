import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { sendTransactionalEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";
import { buildSpecialReconfirmEmailHtml } from "@/lib/email/special-reconfirm-email";
import { addDaysToDateStr, PUBLIC_SPECIAL_COLUMNS, SPECIAL_LIFETIME_DAYS } from "./index";
import type { Special } from "@/types";

/** Ask this many days before a special lapses. */
export const RECONFIRM_LEAD_DAYS = 7;
/** Never ask the same venue again sooner than this. */
export const RECONFIRM_RESEND_DAYS = 5;
/** Bounded like the rest of the nightly route. */
export const RECONFIRM_MAX_PER_RUN = 20;

export type ReconfirmRow = {
  id: string;
  venue_name: string;
  title: string;
  status: string;
  expires_on: string;
  contact_email: string | null;
  confirm_token: string;
  reconfirm_sent_at: string | null;
};

/** Live, lapsing within the lead window, reachable by email, not asked recently. */
export function isDueForReconfirm(row: ReconfirmRow, todayStr: string, now: Date): boolean {
  if (row.status !== "live" || !row.contact_email) return false;
  if (row.expires_on > addDaysToDateStr(todayStr, RECONFIRM_LEAD_DAYS)) return false;
  if (row.expires_on < todayStr) return false; // already lapsed: the venue re-adds it
  if (!row.reconfirm_sent_at) return true;
  const ageMs = now.getTime() - new Date(row.reconfirm_sent_at).getTime();
  return ageMs >= RECONFIRM_RESEND_DAYS * 24 * 60 * 60 * 1000;
}

/** One message per venue + address, however many specials it runs. */
export function groupForReconfirm(rows: ReconfirmRow[]): ReconfirmRow[][] {
  const groups = new Map<string, ReconfirmRow[]>();
  for (const r of rows) {
    const key = `${r.venue_name.trim().toLowerCase()}|${(r.contact_email ?? "").toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.values()];
}

export function confirmUrl(token: string): string {
  return `${SITE_URL}/tonight/confirm/${token}`;
}

export type ReconfirmRunResult = { due: number; venues: number; sent: number; failed: number };

/** The nightly step: email each due venue its private "still running?" link. */
export async function sendDueReconfirms({ dryRun = false } = {}): Promise<ReconfirmRunResult> {
  const supabase = createAdminClient();
  const today = nowInBali().dateStr;
  const { data, error } = await supabase
    .from("specials")
    .select("id, venue_name, title, status, expires_on, contact_email, confirm_token, reconfirm_sent_at")
    .eq("status", "live")
    .not("contact_email", "is", null)
    .lte("expires_on", addDaysToDateStr(today, RECONFIRM_LEAD_DAYS));
  if (error) throw new Error(`specials reconfirm read: ${error.message}`);

  const now = new Date();
  const due = ((data ?? []) as ReconfirmRow[]).filter((r) => isDueForReconfirm(r, today, now));
  const groups = groupForReconfirm(due).slice(0, RECONFIRM_MAX_PER_RUN);
  const result: ReconfirmRunResult = { due: due.length, venues: groups.length, sent: 0, failed: 0 };
  if (dryRun) return result;

  for (const group of groups) {
    const first = group[0];
    const ok = await sendTransactionalEmail(
      first.contact_email!,
      `Is your special at ${first.venue_name} still running?`,
      buildSpecialReconfirmEmailHtml({
        venueName: first.venue_name,
        titles: group.map((r) => r.title),
        expiresOn: group.reduce((min, r) => (r.expires_on < min ? r.expires_on : min), first.expires_on),
        confirmUrl: confirmUrl(first.confirm_token),
      })
    );
    if (!ok) {
      result.failed++;
      continue;
    }
    await supabase
      .from("specials")
      .update({ reconfirm_sent_at: now.toISOString() })
      .in("id", group.map((r) => r.id));
    result.sent++;
  }
  return result;
}

export type VenueSpecials = { venueName: string; specials: Special[] };

/**
 * Everything live (or lapsed in the last 30 days) at the token's venue. One
 * link covers the whole venue, so a bar with ten weekly specials taps once.
 */
export async function getVenueByToken(token: string): Promise<VenueSpecials | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const supabase = createAdminClient();
  const { data: hit } = await supabase
    .from("specials")
    .select("venue_name")
    .eq("confirm_token", token)
    .maybeSingle();
  if (!hit) return null;
  const venueName = (hit as { venue_name: string }).venue_name;
  const { data } = await supabase
    .from("specials")
    .select(PUBLIC_SPECIAL_COLUMNS)
    .eq("venue_name", venueName)
    .eq("status", "live")
    .gte("expires_on", addDaysToDateStr(nowInBali().dateStr, -SPECIAL_LIFETIME_DAYS))
    .order("title");
  return { venueName, specials: (data ?? []) as Special[] };
}

export type ApplyResult = { confirmed: number; stopped: number };

/** Keep every special at the venue for another 30 days, except the stopped ones, which are hidden. */
export async function applyReconfirm(token: string, stoppedIds: string[]): Promise<ApplyResult | null> {
  const venue = await getVenueByToken(token);
  if (!venue) return null;
  const ids = new Set(venue.specials.map((s) => s.id));
  const stopped = stoppedIds.filter((id) => ids.has(id));
  const keep = [...ids].filter((id) => !stopped.includes(id));
  const supabase = createAdminClient();

  if (keep.length > 0) {
    const { error } = await supabase
      .from("specials")
      .update({
        confirmed_at: new Date().toISOString(),
        expires_on: addDaysToDateStr(nowInBali().dateStr, SPECIAL_LIFETIME_DAYS),
        reconfirm_sent_at: null,
        updated_at: new Date().toISOString(),
      })
      .in("id", keep);
    if (error) throw new Error(`specials reconfirm: ${error.message}`);
  }
  if (stopped.length > 0) {
    const { error } = await supabase
      .from("specials")
      .update({ status: "hidden", updated_at: new Date().toISOString() })
      .in("id", stopped);
    if (error) throw new Error(`specials stop: ${error.message}`);
  }
  return { confirmed: keep.length, stopped: stopped.length };
}
