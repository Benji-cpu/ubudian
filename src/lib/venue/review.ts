import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { addDaysToDateStr, SPECIAL_LIFETIME_DAYS } from "@/lib/specials";
import { EDITABLE_DEAL_FIELDS } from "./schema";

/**
 * The daily review of venue submissions (.claude/agents/deals-reviewer.md).
 * The repo is public and the routine reads this through git, so only public
 * fields leave the database: never contact details.
 */

/** A pending deal this many days old with no decision is taken down by the nightly run. */
export const PENDING_MAX_DAYS = 14;

export type ReviewItem = {
  id: string;
  kind: "new" | "edit";
  venue_name: string;
  venue_area: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  source_url: string | null;
  current: Record<string, unknown> | null;
  proposed: Record<string, unknown>;
  submitted_at: string;
  previous_note: string | null;
};

const ROW_COLS =
  "id, status, venue_name, venue_area, instagram_handle, website_url, source_url, title, description, price_idr, normal_price_idr, weekdays, start_time, end_time, pending_changes, review_note, updated_at, created_at";

type Row = Record<string, unknown> & { id: string; status: string; pending_changes: Record<string, unknown> | null };

const pick = (r: Record<string, unknown>) => Object.fromEntries(EDITABLE_DEAL_FIELDS.map((k) => [k, r[k] ?? null]));

export function toReviewItem(r: Row): ReviewItem {
  const isEdit = r.status === "live" && !!r.pending_changes;
  return {
    id: r.id,
    kind: isEdit ? "edit" : "new",
    venue_name: r.venue_name as string,
    venue_area: (r.venue_area as string) ?? null,
    instagram_handle: (r.instagram_handle as string) ?? null,
    website_url: (r.website_url as string) ?? null,
    source_url: (r.source_url as string) ?? null,
    current: isEdit ? pick(r) : null,
    proposed: isEdit ? pick({ ...pick(r), ...r.pending_changes! }) : pick(r),
    submitted_at: (r.updated_at as string) ?? (r.created_at as string),
    previous_note: (r.review_note as string) ?? null,
  };
}

/** Everything waiting: new pending deals and live deals with a change waiting. */
export async function listForReview(): Promise<ReviewItem[]> {
  const supabase = createAdminClient();
  const [pending, edits] = await Promise.all([
    supabase.from("specials").select(ROW_COLS).eq("status", "pending"),
    supabase.from("specials").select(ROW_COLS).eq("status", "live").not("pending_changes", "is", null),
  ]);
  if (pending.error) throw new Error(pending.error.message);
  if (edits.error) throw new Error(edits.error.message);
  return [...(pending.data ?? []), ...(edits.data ?? [])].map((r) => toReviewItem(r as Row));
}

export const decisionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["publish", "flag", "reject"]),
  note: z.string().trim().min(3).max(300),
});
export const decisionsSchema = z.object({ decisions: z.array(decisionSchema).max(200) });
export type Decision = z.infer<typeof decisionSchema>;

/**
 * The row update for one decision, or null when it no longer applies (the
 * deal was edited or taken down since the routine read it).
 */
export function updateFor(row: Row, d: Decision, todayStr: string, nowIso: string): Record<string, unknown> | null {
  const isEdit = row.status === "live" && !!row.pending_changes;
  const isNew = row.status === "pending";
  if (!isEdit && !isNew) return null;
  const base = { review_note: `${d.action}: ${d.note}`, reviewed_at: nowIso, updated_at: nowIso };
  if (d.action === "flag") return base; // stays waiting; the admin sees the note on /admin/deals
  if (d.action === "reject") return isEdit ? { ...base, pending_changes: null } : { ...base, status: "hidden" };
  const fresh = { confirmed_at: nowIso, expires_on: addDaysToDateStr(todayStr, SPECIAL_LIFETIME_DAYS) };
  if (isEdit) {
    const changes = Object.fromEntries(Object.entries(row.pending_changes!).filter(([k]) => (EDITABLE_DEAL_FIELDS as readonly string[]).includes(k)));
    return { ...base, ...fresh, ...changes, days_stated: true, pending_changes: null };
  }
  return { ...base, ...fresh, status: "live" };
}

export type ApplyReport = { published: number; flagged: number; rejected: number; skipped: number };

export async function applyDecisions(decisions: Decision[]): Promise<ApplyReport> {
  const supabase = createAdminClient();
  const report: ApplyReport = { published: 0, flagged: 0, rejected: 0, skipped: 0 };
  const today = nowInBali().dateStr;
  for (const d of decisions) {
    const { data } = await supabase.from("specials").select("id, status, pending_changes").eq("id", d.id).maybeSingle();
    const update = data ? updateFor(data as Row, d, today, new Date().toISOString()) : null;
    if (!update) {
      report.skipped++;
      continue;
    }
    const { error } = await supabase.from("specials").update(update).eq("id", d.id);
    if (error) report.skipped++;
    else report[d.action === "publish" ? "published" : d.action === "flag" ? "flagged" : "rejected"]++;
  }
  return report;
}

/** Nightly backstop: nothing waits forever, even if the routine stops running. */
export async function expireStalePending(): Promise<{ expired: number; oldestHours: number | null; waiting: number }> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - PENDING_MAX_DAYS * 864e5).toISOString();
  const { data: stale } = await supabase
    .from("specials")
    .update({ status: "hidden", review_note: `expired: no review decision within ${PENDING_MAX_DAYS} days`, updated_at: new Date().toISOString() })
    .eq("status", "pending")
    .lt("updated_at", cutoff)
    .select("id");
  const { data: waiting } = await supabase.from("specials").select("updated_at").eq("status", "pending").order("updated_at").limit(500);
  const oldest = (waiting ?? [])[0] as { updated_at: string } | undefined;
  return {
    expired: (stale ?? []).length,
    waiting: (waiting ?? []).length,
    oldestHours: oldest ? Math.round((Date.now() - new Date(oldest.updated_at).getTime()) / 36e5) : null,
  };
}
