/**
 * The pending pool's expiry. Nothing waits for a person.
 *
 * `archivePastPendingEvents` retires a one-off once its date passes, but it
 * skips recurring rows (their seed date is always in the past) and a future
 * one-off can sit for months. On 2026-09-15, 39 of the 60 pending rows were
 * older than 30 days; the oldest had been re-screened by the gate 98 nights in
 * a row with the same verdict. A row the gate has declined for
 * {@link PENDING_MAX_AGE_DAYS} consecutive nights is not going to change — the
 * harvester that produced it will produce a fresh one if the event is real.
 *
 * Ordering matters: this runs AFTER the gate, and skips whatever the gate held
 * only because its per-run cap was reached, so a good row is never expired on
 * the night it finally got its turn.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export const PENDING_MAX_AGE_DAYS = 30;

export interface ExpiryResult {
  expired: number;
  errors: string[];
}

export async function expireStalePendingEvents(
  options: { exclude?: Set<string>; now?: Date } = {},
): Promise<ExpiryResult> {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - PENDING_MAX_AGE_DAYS * 86_400_000).toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .limit(500);
  if (error) return { expired: 0, errors: [`expiry fetch: ${error.message}`] };

  const ids = ((data ?? []) as { id: string }[])
    .map((r) => r.id)
    .filter((id) => !options.exclude?.has(id));
  if (ids.length === 0) return { expired: 0, errors: [] };

  const { data: updated, error: updError } = await supabase
    .from("events")
    .update({ status: "archived", moderation_reason: `expired_unpublished_${PENDING_MAX_AGE_DAYS}d` })
    .in("id", ids)
    .eq("status", "pending")
    .select("id");
  if (updError) return { expired: 0, errors: [`expiry update: ${updError.message}`] };
  return { expired: updated?.length ?? 0, errors: [] };
}

/**
 * Approved recurring rows whose rule's `until` has passed. They never hit
 * `archivePastApprovedEvents` (it skips recurring rows) and, before the
 * `until` field existed, could not be detected at all.
 */
export async function archiveEndedRecurringEvents(todayStr: string): Promise<ExpiryResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, recurrence_rule")
    .eq("status", "approved")
    .eq("is_recurring", true)
    .like("recurrence_rule", "%until%")
    .limit(1000);
  if (error) return { expired: 0, errors: [`ended-series fetch: ${error.message}`] };

  const ended: string[] = [];
  for (const row of (data ?? []) as { id: string; recurrence_rule: string | null }[]) {
    const until = row.recurrence_rule?.match(/"until"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (until && until < todayStr) ended.push(row.id);
  }
  if (ended.length === 0) return { expired: 0, errors: [] };

  const { data: updated, error: updError } = await supabase
    .from("events")
    .update({ status: "archived", moderation_reason: `archived_series_ended_${todayStr}` })
    .in("id", ended)
    .eq("status", "approved")
    .select("id");
  if (updError) return { expired: 0, errors: [`ended-series update: ${updError.message}`] };
  return { expired: updated?.length ?? 0, errors: [] };
}

/**
 * One-time-and-then-idempotent: bring every legacy recurring row onto the one
 * rule format (`normalizeRecurrenceRule`), folding a series end that sits in
 * `end_date` into the rule's `until`, and demoting a recurring flag with no
 * parseable rule to a one-off. This is migration
 * `20260915090000_recurrence_until.sql` steps 1–4 expressed through the same
 * code path the pipeline uses on insert, run nightly so that (a) it applies
 * without a hand-run SQL session and (b) any row that slips in through an
 * unnormalised path is corrected within a day. Finds nothing once the data
 * is clean. The CHECK constraint (step 5) is DDL and stays in the SQL file.
 */
export async function normalizeLegacyRecurrence(): Promise<{ normalized: number; demoted: number; errors: string[] }> {
  const { normalizeRecurrenceRule } = await import("@/lib/recurrence");
  const supabase = createAdminClient();
  const errors: string[] = [];
  let normalized = 0;
  let demoted = 0;

  const { data, error } = await supabase
    .from("events")
    .select("id, recurrence_rule, end_date")
    .eq("is_recurring", true)
    .or("recurrence_rule.is.null,recurrence_rule.not.like.{%,end_date.not.is.null")
    .limit(500);
  if (error) return { normalized, demoted, errors: [`legacy recurrence fetch: ${error.message}`] };

  for (const row of (data ?? []) as { id: string; recurrence_rule: string | null; end_date: string | null }[]) {
    const rule = normalizeRecurrenceRule(row.recurrence_rule, row.end_date);
    const patch = rule
      ? { recurrence_rule: rule, end_date: null }
      : { is_recurring: false, recurrence_rule: null };
    const { error: upd } = await supabase.from("events").update(patch).eq("id", row.id);
    if (upd) {
      errors.push(`legacy recurrence ${row.id}: ${upd.message}`);
      continue;
    }
    if (rule) normalized += 1;
    else demoted += 1;
  }
  return { normalized, demoted, errors };
}

/**
 * Pre-parsed sources (Megatix, todo.today) leave every raw message in
 * `pending` because the pipeline only advances the status for messages it
 * parses itself. 8,194 such rows older than 14 days had accumulated by
 * 2026-09-15 and nothing reads them: the event row (or its dedup skip) is
 * the record. Purge in bounded batches so one night never runs long.
 */
export async function purgeStalePendingMessages(): Promise<ExpiryResult> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("raw_ingestion_messages")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .limit(2000);
  if (error) return { expired: 0, errors: [`stale messages fetch: ${error.message}`] };
  const candidates = ((data ?? []) as { id: string }[]).map((r) => r.id);
  if (candidates.length === 0) return { expired: 0, errors: [] };

  // Retention policy (docs/data-retention.md): a message an event was created
  // from is kept indefinitely so the event can be traced to its source. The
  // pre-parsed adapters never flip such a message to `processed`, so check the
  // events table directly rather than trusting the status.
  const referenced = new Set<string>();
  for (let i = 0; i < candidates.length; i += 200) {
    const chunk = candidates.slice(i, i + 200);
    const { data: refs, error: refError } = await supabase
      .from("events")
      .select("raw_message_id")
      .in("raw_message_id", chunk);
    if (refError) return { expired: 0, errors: [`stale messages refs: ${refError.message}`] };
    for (const r of (refs ?? []) as { raw_message_id: string | null }[]) if (r.raw_message_id) referenced.add(r.raw_message_id);
  }
  const ids = candidates.filter((id) => !referenced.has(id));
  if (ids.length === 0) return { expired: 0, errors: [] };
  // Chunked for the same reason the reference lookup above is: PostgREST puts
  // an `in` list in the QUERY STRING, and ~2000 uuids overruns it — the server
  // answers "Bad Request" and the purge silently does nothing. It had been
  // failing that way on every run; the batch cap is 2000, so the unchunked
  // delete could never have succeeded once the backlog passed a few hundred.
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { error: delError } = await supabase.from("raw_ingestion_messages").delete().in("id", chunk);
    if (delError) return { expired: deleted, errors: [`stale messages delete: ${delError.message}`] };
    deleted += chunk.length;
  }
  return { expired: deleted, errors: [] };
}
