/**
 * Autonomous cleanup helpers run by the daily-maintenance cron and remote
 * scheduled agent. Each helper is idempotent — calling it twice in a row
 * should be a no-op the second time.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { titleSimilarity } from "@/lib/maintenance/similarity";

/**
 * Hard-delete raw_ingestion_messages with status='failed' that are older than
 * 30 days. The pipeline retries failed messages for 24h then leaves them.
 * After a month they're noise — remove to keep the table lean.
 */
export async function purgeFailedMessages(olderThanDays = 30): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("raw_ingestion_messages")
    .delete()
    .eq("status", "failed")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[purgeFailedMessages] error:", error);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Cancel bookings stuck in 'pending' with no Stripe checkout session after
 * the abandon window (default 24h). These are users who started checkout but
 * bailed before being redirected to Stripe.
 */
export async function cancelStaleBookings(abandonHours = 24): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - abandonHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "pending")
    .is("stripe_checkout_session_id", null)
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[cancelStaleBookings] error:", error);
    return 0;
  }
  return data?.length ?? 0;
}

interface DupCandidate {
  id: string;
  title: string;
  venue_name: string | null;
  start_date: string;
  created_at: string;
}

/**
 * Find approved future events that look like duplicates (same start_date,
 * same canonicalised venue_name, title similarity ≥ threshold) and archive
 * the newer of each pair, recording the decision in dedup_decisions for
 * audit. The migration that backs dedup_decisions must be applied first;
 * otherwise the insert fails and the event stays approved (safe fallback).
 *
 * Compares titles via {@link titleSimilarity} (Jaccard over token bigrams +
 * substring boost) so we don't need pg_trgm at runtime.
 */
export async function archiveFuzzyDuplicateEvents(
  similarityThreshold = 0.85,
): Promise<number> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, venue_name, start_date, created_at")
    .eq("status", "approved")
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  if (error || !events?.length) {
    if (error) console.error("[archiveFuzzyDuplicateEvents] fetch error:", error);
    return 0;
  }

  // Bucket by (start_date, normalised venue) — only events that share both can
  // be considered duplicates. Skip rows missing venue.
  const buckets = new Map<string, DupCandidate[]>();
  for (const e of events as DupCandidate[]) {
    const venueKey = (e.venue_name || "").trim().toLowerCase();
    if (!venueKey) continue;
    const key = `${e.start_date}::${venueKey}`;
    const arr = buckets.get(key) ?? [];
    arr.push(e);
    buckets.set(key, arr);
  }

  const archivedIds = new Set<string>();
  for (const candidates of buckets.values()) {
    if (candidates.length < 2) continue;
    // Sort oldest first so we keep the original and archive the later post.
    candidates.sort((a, b) => a.created_at.localeCompare(b.created_at));

    for (let i = 0; i < candidates.length; i += 1) {
      if (archivedIds.has(candidates[i].id)) continue;
      for (let j = i + 1; j < candidates.length; j += 1) {
        if (archivedIds.has(candidates[j].id)) continue;
        const sim = titleSimilarity(candidates[i].title, candidates[j].title);
        if (sim < similarityThreshold) continue;

        const { error: updErr } = await supabase
          .from("events")
          .update({ status: "archived" })
          .eq("id", candidates[j].id)
          .eq("status", "approved");

        if (updErr) {
          console.error("[archiveFuzzyDuplicateEvents] update error:", updErr);
          continue;
        }

        const { error: logErr } = await supabase.from("dedup_decisions").insert({
          kept_event_id: candidates[i].id,
          archived_event_id: candidates[j].id,
          reason: "fuzzy-duplicate (same date, same venue, similar title)",
          similarity: Number(sim.toFixed(3)),
          decided_by: "daily-maintenance",
        });
        // If the audit log insert fails (migration not applied), revert the
        // archive so the event reappears on the next run rather than being
        // silently lost.
        if (logErr) {
          console.error("[archiveFuzzyDuplicateEvents] log error, reverting:", logErr);
          await supabase
            .from("events")
            .update({ status: "approved" })
            .eq("id", candidates[j].id);
          continue;
        }
        archivedIds.add(candidates[j].id);
      }
    }
  }
  return archivedIds.size;
}
