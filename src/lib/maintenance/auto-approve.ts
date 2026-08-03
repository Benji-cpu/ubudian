/**
 * The autonomous editorial gate.
 *
 * Background: `pipeline.ts` inserts every ingested event as `status='pending'`
 * with the comment "the daily Claude approver routine is the editorial gate."
 * That routine was disabled 2026-05-20 and its human replacement
 * (a 60-minute-a-day checklist, since retired; its record is in
 * `docs/daily-routine-log.md`) last ran 2026-06-10. For the eight weeks after
 * that, ~19 events landed in `pending` every night and not one was ever
 * published — `archivePastPendingEvents()` silently archived each one as its
 * date passed. The ingestion fleet was running into a void.
 *
 * This module is that missing gate, run by machine instead of by hand.
 *
 * Design rules, in priority order:
 *
 *  1. **Never require a human.** Anything this gate declines stays `pending`
 *     and expires exactly as it does today. We deliberately do NOT build a
 *     review queue — a queue is unpaid work for the operator, which is the
 *     failure mode we are fixing.
 *  2. **Bounded blast radius.** A per-run cap means a bad rule publishes
 *     {@link AUTO_APPROVE_MAX_PER_RUN} bad events, not the whole backlog.
 *  3. **Reversible.** Every auto-published row is stamped with
 *     `auto_approved_at`, so the entire experiment reverses with one
 *     statement: `UPDATE events SET status='pending', auto_approved_at=NULL
 *     WHERE auto_approved_at IS NOT NULL`.
 *  4. **Soonest first.** Candidates are ordered by `start_date` ascending.
 *     An event happening this Friday is worth more than one in October, and
 *     it is also the one about to expire unpublished.
 *
 * The structural screen ({@link screenPendingEvent}) is a pure function so it
 * can be tested without a database or a network call. Only events that clear
 * it cost a Gemini moderation call.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateEvent } from "@/lib/events/moderation";
import { nowInBali } from "@/lib/events/bali-time";
import { parseRecurrenceRule } from "@/lib/recurrence";
import { EVENT_CATEGORIES } from "@/lib/constants";

/** Most events one run may publish. Deliberately small — see rule 2 above. */
export const AUTO_APPROVE_MAX_PER_RUN = 25;

/** Wall-clock budget. The route also does link-health, so leave it room. */
const MAX_ELAPSED_MS = 25_000;

/**
 * Moderation calls in flight at once. The gate is entirely bounded by Gemini
 * latency (~1.2s per call serially), so this is what decides whether a run
 * clears its cap inside the budget.
 */
const MODERATION_CONCURRENCY = 5;

/** Event ids per dedup lookup. Keeps the PostgREST filter URL under ~16KB. */
const DEDUP_LOOKUP_CHUNK = 50;

/**
 * Below this the parser itself judged the listing not publish-ready (scale is
 * 0.0–1.0, see `llm-prompts.ts`). Null means the adapter was pre-parsed and
 * never scored it, which is not evidence of low quality — don't penalise it.
 */
const MIN_QUALITY_SCORE = 0.4;

const MIN_TITLE_LENGTH = 6;
/** Short enough to admit a terse-but-real listing, long enough to reject stubs. */
const MIN_DESCRIPTION_LENGTH = 40;
const MIN_VENUE_LENGTH = 3;

const VALID_CATEGORIES = new Set<string>(EVENT_CATEGORIES);

export interface PendingEventRow {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  category: string | null;
  venue_name: string | null;
  start_date: string;
  end_date: string | null;
  is_recurring: boolean | null;
  recurrence_rule: string | null;
  content_flags: string[] | null;
  quality_score: number | null;
  organizer_name: string | null;
  source_url: string | null;
}

export type ScreenResult = { ok: true } | { ok: false; reason: string };

/**
 * The free, deterministic half of the gate. Runs before any AI call.
 *
 * `todayStr` is the Bali calendar date (YYYY-MM-DD) — passed in rather than
 * read from the clock so this stays pure and testable.
 */
export function screenPendingEvent(event: PendingEventRow, todayStr: string): ScreenResult {
  const title = (event.title ?? "").trim();
  if (title.length < MIN_TITLE_LENGTH) {
    return { ok: false, reason: `title too short (${title.length} chars)` };
  }

  // Fall back to short_description: several pre-parsed adapters put the real
  // copy there and mirror the title into `description`.
  const description = (event.description ?? "").trim();
  const shortDescription = (event.short_description ?? "").trim();
  const bodyLength = Math.max(description.length, shortDescription.length);
  if (bodyLength < MIN_DESCRIPTION_LENGTH) {
    return { ok: false, reason: `description too thin (${bodyLength} chars)` };
  }

  const venue = (event.venue_name ?? "").trim();
  if (venue.length < MIN_VENUE_LENGTH) {
    return { ok: false, reason: "no usable venue" };
  }

  const category = (event.category ?? "").trim();
  if (!VALID_CATEGORIES.has(category)) {
    return { ok: false, reason: `unknown category "${category}"` };
  }
  // "Other" is what the parser emits when it could not classify. Publishing it
  // puts an unclassified card into a feed whose whole value is curation.
  if (category === "Other") {
    return { ok: false, reason: "category is the unclassified fallback" };
  }

  const flags = event.content_flags ?? [];
  if (flags.length > 0) {
    return { ok: false, reason: `parser flags: ${flags.join(", ")}` };
  }

  if (event.quality_score !== null && event.quality_score < MIN_QUALITY_SCORE) {
    return { ok: false, reason: `quality_score ${event.quality_score} below ${MIN_QUALITY_SCORE}` };
  }

  // A recurring event legitimately carries a seed date in the past, so it is
  // exempt from the past-date check below — but only if it genuinely still
  // recurs. Two ways it might not:
  //
  //   1. The rule names an end that has passed. `recurrence_rule` has no
  //      `until` field, but bad rows carry it as free text ("until 2026-06-09")
  //      or as an RRULE `UNTIL=`. Either way the series is over.
  //   2. The rule doesn't parse at all. `expandRecurrence` falls back to
  //      emitting the seed date alone, so such an event behaves exactly like a
  //      one-off — and should be judged as one.
  const recurrenceEnd = recurrenceEndDate(event.recurrence_rule);
  const stillRecurs =
    !!event.is_recurring &&
    parseRecurrenceRule(event.recurrence_rule) !== null &&
    (recurrenceEnd === null || recurrenceEnd >= todayStr);

  if (event.is_recurring && !stillRecurs) {
    return {
      ok: false,
      reason: recurrenceEnd
        ? `recurrence ended ${recurrenceEnd}`
        : `recurring but rule is unparseable ("${(event.recurrence_rule ?? "").slice(0, 40)}")`,
    };
  }

  // One-off events must not already be over. `end_date` covers multi-day
  // festivals that are mid-run today.
  const lastDay =
    event.end_date && event.end_date > event.start_date ? event.end_date : event.start_date;
  if (!stillRecurs && lastDay < todayStr) {
    return { ok: false, reason: `already past (${lastDay} < ${todayStr})` };
  }

  return { ok: true };
}

/** ISO date an `UNTIL=`/`until …` clause names, or null if the rule has none. */
function recurrenceEndDate(rule: string | null): string | null {
  if (!rule) return null;
  // RRULE form: UNTIL=20260609 or UNTIL=20260609T000000Z
  const rrule = rule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/i);
  if (rrule) return `${rrule[1]}-${rrule[2]}-${rrule[3]}`;
  // Free-text form the parsers emit: "until 2026-06-09"
  const freeText = rule.match(/until\s+(\d{4}-\d{2}-\d{2})/i);
  return freeText ? freeText[1] : null;
}

export type AutoApproveVerdict = "approved" | "rejected" | "held";

export interface AutoApproveDecision {
  id: string;
  title: string;
  startDate: string;
  category: string | null;
  /** Surfaced so a reviewer can tell a past seed date from a stale listing. */
  recurring: boolean;
  verdict: AutoApproveVerdict;
  reason: string;
}

export interface AutoApproveResult {
  dryRun: boolean;
  /** Pending rows examined this run (not the size of the whole backlog). */
  scanned: number;
  approved: number;
  rejected: number;
  held: number;
  /** Truncated for payload size; the counters above are complete. */
  decisions: AutoApproveDecision[];
  /**
   * Complete tally of why events were held, keyed by a normalised reason.
   * Unlike `decisions` this is never truncated — it is the signal for whether
   * a screening rule is doing too much work.
   */
  heldReasons: Record<string, number>;
  errors: string[];
}

const MAX_REPORTED_DECISIONS = 60;
/**
 * Over-fetch relative to the cap so the cap limits *publications*, not
 * *inspections* — a backlog full of thin listings shouldn't stall the one
 * good event behind them.
 */
const CANDIDATE_FETCH_MULTIPLIER = 6;

export interface AutoApproveOptions {
  /** Screen and report without writing anything. Used by `?dryRun=true`. */
  dryRun?: boolean;
  limit?: number;
  /**
   * Wall-clock budget. Defaults to {@link MAX_ELAPSED_MS}, sized for the cron
   * route (which also runs a link-health sweep). The one-time backlog drain
   * raises it — see `scripts/auto-approve-dry-run.ts`.
   */
  maxElapsedMs?: number;
  /** Parallel moderation calls. Gemini flash-lite tolerates this comfortably. */
  moderationConcurrency?: number;
}

/**
 * Run `worker` over `items` with a bounded number in flight, preserving input
 * order in the returned array. (`cleanups.ts` has a settled-results variant;
 * this one propagates the value directly because `moderateEvent` never throws.)
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      out[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return out;
}

/**
 * Screen the pending backlog and publish what clears the gate.
 *
 * Idempotent in the sense that matters: a second run finds the approved rows
 * gone from the pending pool and only considers what is genuinely still
 * waiting. Held events are re-screened every night, so an event that gains a
 * description or a venue later is picked up without intervention.
 */
export async function autoApprovePending(
  options: AutoApproveOptions = {},
): Promise<AutoApproveResult> {
  const dryRun = options.dryRun ?? false;
  const limit = options.limit ?? AUTO_APPROVE_MAX_PER_RUN;
  const maxElapsedMs = options.maxElapsedMs ?? MAX_ELAPSED_MS;
  const moderationConcurrency = options.moderationConcurrency ?? MODERATION_CONCURRENCY;
  const startedAt = Date.now();

  const result: AutoApproveResult = {
    dryRun,
    scanned: 0,
    approved: 0,
    rejected: 0,
    held: 0,
    decisions: [],
    heldReasons: {},
    errors: [],
  };

  const supabase = createAdminClient();
  const today = nowInBali().dateStr;

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, description, short_description, category, venue_name, start_date, end_date, is_recurring, recurrence_rule, content_flags, quality_score, organizer_name, source_url",
    )
    .eq("status", "pending")
    .or(`start_date.gte.${today},end_date.gte.${today},is_recurring.eq.true`)
    // One-offs first, then by date. `start_date` alone is the wrong order: a
    // recurring event's start_date is its *seed*, often months old, so sorting
    // on it puts every weekly rhythm ahead of the one-off happening on Friday —
    // which is exactly the event about to expire unpublished. Recurring rows
    // never expire, so they can wait for a later run.
    .order("is_recurring", { ascending: true })
    .order("start_date", { ascending: true })
    .limit(limit * CANDIDATE_FETCH_MULTIPLIER);

  if (error) {
    result.errors.push(`autoApprovePending fetch: ${error.message}`);
    return result;
  }

  const candidates = (data ?? []) as PendingEventRow[];
  result.scanned = candidates.length;
  if (candidates.length === 0) return result;

  // One batched lookup rather than a query per event: an unresolved fuzzy or
  // semantic dedup match means we are not confident this isn't already live.
  const contested = await fetchContestedEventIds(
    supabase,
    candidates.map((c) => c.id),
  );

  const record = (
    event: PendingEventRow,
    verdict: AutoApproveVerdict,
    reason: string,
  ): void => {
    if (verdict === "approved") result.approved += 1;
    else if (verdict === "rejected") result.rejected += 1;
    else {
      result.held += 1;
      const key = normaliseReason(reason);
      result.heldReasons[key] = (result.heldReasons[key] ?? 0) + 1;
    }

    if (result.decisions.length < MAX_REPORTED_DECISIONS) {
      result.decisions.push({
        id: event.id,
        title: event.title,
        startDate: event.start_date,
        category: event.category,
        recurring: !!event.is_recurring,
        verdict,
        reason,
      });
    }
  };

  // Pass 1 — the free, deterministic screen over every candidate. Doing this
  // for all of them before any AI call means the per-run cap and the time
  // budget apply to *moderation*, which is the only expensive step.
  const shortlist: PendingEventRow[] = [];
  for (const event of candidates) {
    const screen = screenPendingEvent(event, today);
    if (!screen.ok) {
      record(event, "held", screen.reason);
      continue;
    }
    if (contested.has(event.id)) {
      record(event, "held", "unresolved dedup match");
      continue;
    }
    if (shortlist.length >= limit) {
      record(event, "held", "per-run cap reached");
      continue;
    }
    shortlist.push(event);
  }

  // Pass 2 — moderate the shortlist, a few at a time. Ingested events have
  // never been through the safety gate: `pipeline.ts` applies only the keyword
  // ICP filter, so this is the first and only place ingestion content is
  // moderated. It fails open by design (see `moderation.ts`), which is safe
  // here because pass 1 already dropped everything thin, unclassified,
  // parser-flagged or contested.
  const verdicts = await mapWithConcurrency(shortlist, moderationConcurrency, async (event) => {
    if (Date.now() - startedAt > maxElapsedMs) return null;
    return moderateEvent({
      title: event.title,
      description: event.description || event.short_description || event.title,
      organizer_name: event.organizer_name,
      venue_name: event.venue_name,
      source_url: event.source_url,
      origin: "ingestion",
    });
  });

  for (let i = 0; i < shortlist.length; i += 1) {
    const event = shortlist[i];
    const verdict = verdicts[i];

    if (verdict === null) {
      record(event, "held", "run budget exhausted");
      continue;
    }

    if (!verdict.ok) {
      if (!dryRun) {
        const { error: rejectError } = await supabase
          .from("events")
          .update({
            status: "rejected",
            moderation_reason: `auto_gate:${verdict.flag}`,
            rejection_reason: verdict.reason,
          })
          .eq("id", event.id)
          .eq("status", "pending");
        if (rejectError) {
          result.errors.push(`reject ${event.id}: ${rejectError.message}`);
          continue;
        }
      }
      record(event, "rejected", `${verdict.flag}: ${verdict.reason}`);
      continue;
    }

    if (!dryRun) {
      const now = new Date().toISOString();
      const { error: approveError } = await supabase
        .from("events")
        .update({
          status: "approved",
          auto_approved_at: now,
          ai_approved_at: now,
          moderation_reason: "auto_gate",
        })
        .eq("id", event.id)
        // Re-assert the precondition so a concurrent admin decision wins.
        .eq("status", "pending");
      if (approveError) {
        result.errors.push(`approve ${event.id}: ${approveError.message}`);
        continue;
      }
    }
    record(event, "approved", "cleared structural screen and moderation");
  }

  return result;
}

/**
 * Strip the specifics (dates, counts, quoted values) out of a hold reason so
 * reasons of the same kind tally together instead of each being unique.
 */
function normaliseReason(reason: string): string {
  return reason
    .replace(/\([^)]*\)/g, "")
    .replace(/"[^"]*"/g, "…")
    .replace(/\d{4}-\d{2}-\d{2}/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Event ids carrying an unresolved dedup match. `dedup_matches` records both
 * directions, so check either column.
 */
async function fetchContestedEventIds(
  supabase: ReturnType<typeof createAdminClient>,
  ids: string[],
): Promise<Set<string>> {
  const contested = new Set<string>();
  if (ids.length === 0) return contested;

  // PostgREST puts filters in the URL and rejects request headers over ~16KB.
  // A UUID costs ~37 chars and appears twice per row (both match directions),
  // so the whole backlog in one `.in()` overflows it — chunk the lookup.
  for (let offset = 0; offset < ids.length; offset += DEDUP_LOOKUP_CHUNK) {
    const chunk = ids.slice(offset, offset + DEDUP_LOOKUP_CHUNK);
    const list = chunk.join(",");
    const { data, error } = await supabase
      .from("dedup_matches")
      .select("event_a_id, event_b_id")
      .eq("status", "pending")
      .or(`event_a_id.in.(${list}),event_b_id.in.(${list})`);

    if (error) {
      // Fail closed on the dedup check specifically: if we can't tell whether
      // these are duplicates, don't publish any of them this run.
      console.error("[autoApprovePending] dedup lookup failed, holding batch:", error);
      return new Set(ids);
    }

    for (const row of (data ?? []) as { event_a_id: string; event_b_id: string }[]) {
      contested.add(row.event_a_id);
      contested.add(row.event_b_id);
    }
  }
  return contested;
}
