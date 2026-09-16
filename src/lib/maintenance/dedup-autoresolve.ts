/**
 * Resolves the `dedup_matches` backlog by rule, so the editorial gate stops
 * waiting for a reviewer who is not there.
 *
 * History: the admin page `/admin/ingestion/dedup-review` was last used on
 * 2026-04-29. Between then and 2026-09-15 the queue grew to 71 pending rows
 * and, because the gate correctly fails closed on an unresolved match, was
 * holding 23 events every night. Every one of those 71 rows was the same
 * shape — `fuzzy_title` at 0.70–0.90, tagged `recurring_cross_date` — which is
 * to say: a harvester re-listing a weekly series under a slightly different
 * title ("Friday Ecstatic Dance w/ <this week's DJ>").
 *
 * Three rules, applied in order:
 *
 *  1. **Counterpart gone.** If either side is archived or rejected, there is
 *     nothing left to be a duplicate of. Resolve `not_dup`.
 *  2. **Series already live.** A pending recurring row matched against an
 *     approved recurring row at ≥ {@link SERIES_MATCH_MIN_CONFIDENCE}, where
 *     the dedup engine did not rule out a shared weekday, IS that series.
 *     Archive the pending row (its facilitator-of-the-week detail is lost, and
 *     that is the correct trade — one card per weekly rhythm), resolve
 *     `confirmed_dup`.
 *  3. **Nobody came.** A match between two still-pending rows that has waited
 *     {@link UNRESOLVED_MAX_AGE_DAYS} is resolved `not_dup` and each row is
 *     judged on its own by the gate. Publishing two cards for one class is a
 *     small, visible, reversible cost; holding both forever is what we had.
 *
 * Everything this writes is stamped `metadata.auto_rule = '<rule>'` (with
 * `metadata.auto_resolved_at`) so it can be told apart from a human decision
 * and reversed. NOT `resolved_by`: that column is a uuid foreign key to
 * `profiles`, and writing the rule string into it made every single update
 * fail with `invalid input syntax for type uuid` — silently, into the
 * digest's errors array, for every row on every night this ran. An automated
 * resolution has no profile, so the column stays null and the rule lives in
 * the jsonb beside it.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export const SERIES_MATCH_MIN_CONFIDENCE = 0.75;
export const UNRESOLVED_MAX_AGE_DAYS = 14;

interface MatchRow {
  id: string;
  event_a_id: string;
  event_b_id: string;
  confidence: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface EventRow {
  id: string;
  status: string;
  is_recurring: boolean | null;
}

export interface DedupAutoResolveResult {
  scanned: number;
  counterpartGone: number;
  seriesAlreadyLive: number;
  unresolvedTimedOut: number;
  archivedEvents: number;
  errors: string[];
}

export function decideMatch(
  match: MatchRow,
  a: EventRow | undefined,
  b: EventRow | undefined,
  now: Date,
): { rule: "counterpart-gone" | "series-already-live" | "unresolved-timeout"; archive?: string } | null {
  if (!a || !b || a.status === "archived" || a.status === "rejected" || b.status === "archived" || b.status === "rejected") {
    return { rule: "counterpart-gone" };
  }

  const weekdayShared = match.metadata?.weekdayShared;
  const recurringCrossDate = match.metadata?.recurring_cross_date === true;
  const pair: [EventRow, EventRow][] = [[a, b], [b, a]];
  for (const [live, waiting] of pair) {
    if (
      live.status === "approved" &&
      live.is_recurring &&
      waiting.status === "pending" &&
      waiting.is_recurring &&
      recurringCrossDate &&
      match.confidence >= SERIES_MATCH_MIN_CONFIDENCE &&
      weekdayShared !== false
    ) {
      return { rule: "series-already-live", archive: waiting.id };
    }
  }

  const ageMs = now.getTime() - new Date(match.created_at).getTime();
  if (a.status === "pending" && b.status === "pending" && ageMs > UNRESOLVED_MAX_AGE_DAYS * 86_400_000) {
    return { rule: "unresolved-timeout" };
  }

  // approved ↔ approved, or a young pending pair: leave for tomorrow.
  return null;
}

export async function autoResolveDedupMatches(now: Date = new Date()): Promise<DedupAutoResolveResult> {
  const result: DedupAutoResolveResult = {
    scanned: 0,
    counterpartGone: 0,
    seriesAlreadyLive: 0,
    unresolvedTimedOut: 0,
    archivedEvents: 0,
    errors: [],
  };
  const supabase = createAdminClient();

  const { data: matches, error } = await supabase
    .from("dedup_matches")
    .select("id, event_a_id, event_b_id, confidence, metadata, created_at")
    .eq("status", "pending")
    .limit(500);
  if (error) {
    result.errors.push(`dedup autoresolve fetch: ${error.message}`);
    return result;
  }
  const rows = (matches ?? []) as MatchRow[];
  result.scanned = rows.length;
  if (rows.length === 0) return result;

  const ids = Array.from(new Set(rows.flatMap((m) => [m.event_a_id, m.event_b_id])));
  const events = new Map<string, EventRow>();
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error: evError } = await supabase
      .from("events")
      .select("id, status, is_recurring")
      .in("id", ids.slice(i, i + 100));
    if (evError) {
      result.errors.push(`dedup autoresolve events: ${evError.message}`);
      return result;
    }
    for (const e of (data ?? []) as EventRow[]) events.set(e.id, e);
  }

  const stamp = now.toISOString();
  for (const match of rows) {
    const a = events.get(match.event_a_id);
    const b = events.get(match.event_b_id);
    const decision = decideMatch(match, a, b, now);
    if (!decision) continue;

    if (decision.archive) {
      const { error: archiveError } = await supabase
        .from("events")
        .update({ status: "archived", moderation_reason: `duplicate_of:${decision.archive === match.event_a_id ? match.event_b_id : match.event_a_id}` })
        .eq("id", decision.archive)
        .eq("status", "pending");
      if (archiveError) {
        result.errors.push(`archive ${decision.archive}: ${archiveError.message}`);
        continue;
      }
      result.archivedEvents += 1;
      // The archived row may sit on other pending matches; they resolve by rule 1 tomorrow.
      events.set(decision.archive, { ...events.get(decision.archive)!, status: "archived" });
    }

    const status = decision.rule === "series-already-live" ? "confirmed_dup" : "not_dup";
    const { error: updError } = await supabase
      .from("dedup_matches")
      .update({
        status,
        resolved_at: stamp,
        metadata: { ...(match.metadata ?? {}), auto_rule: decision.rule, auto_resolved_at: stamp },
      })
      .eq("id", match.id)
      .eq("status", "pending");
    if (updError) {
      result.errors.push(`resolve ${match.id}: ${updError.message}`);
      continue;
    }
    if (decision.rule === "counterpart-gone") result.counterpartGone += 1;
    else if (decision.rule === "series-already-live") result.seriesAlreadyLive += 1;
    else result.unresolvedTimedOut += 1;
  }

  return result;
}
