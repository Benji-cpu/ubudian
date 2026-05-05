/**
 * Autonomous cleanup helpers run by the daily-maintenance cron and remote
 * scheduled agent. Each helper is idempotent — calling it twice in a row
 * should be a no-op the second time.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { titleSimilarity } from "@/lib/maintenance/similarity";

export type BrokenLink = {
  entity: "event" | "venue";
  id: string;
  url: string;
  status: number | string;
};

export type LinkHealthReport = {
  checked: number;
  broken: BrokenLink[];
};

const LINK_TIMEOUT_MS = 5000;
const LINK_CONCURRENCY = 10;

async function headOnce(url: string): Promise<number | string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LINK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    return res.status;
  } catch (err) {
    return err instanceof Error ? err.name : "fetch_error";
  } finally {
    clearTimeout(timer);
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = { status: "fulfilled", value: await worker(items[idx]) };
      } catch (reason) {
        results[idx] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

/**
 * HEAD every external_ticket_url on approved/pending events and every
 * venue_map_url (deduped by url) sourced from events. Returns a report of
 * URLs that returned 4xx/5xx or failed to fetch within {@link LINK_TIMEOUT_MS}.
 *
 * Throws on missing DB connection — the route's `.catch()` converts that into
 * an entry in `errors[]` so the rest of the digest still ships.
 */
export async function checkExternalLinkHealth(): Promise<LinkHealthReport> {
  const supabase = createAdminClient();

  const eventsRes = await supabase
    .from("events")
    .select("id, external_ticket_url, venue_name, venue_map_url, status")
    .in("status", ["approved", "pending"])
    .or("external_ticket_url.not.is.null,venue_map_url.not.is.null");

  if (eventsRes.error) throw new Error(`checkExternalLinkHealth fetch: ${eventsRes.error.message}`);

  type Row = {
    id: string;
    external_ticket_url: string | null;
    venue_name: string | null;
    venue_map_url: string | null;
  };
  const rows = (eventsRes.data ?? []) as Row[];

  type Target = { entity: "event" | "venue"; id: string; url: string };
  const targets: Target[] = [];
  const seenVenue = new Set<string>();
  for (const row of rows) {
    if (row.external_ticket_url) {
      targets.push({ entity: "event", id: row.id, url: row.external_ticket_url });
    }
    if (row.venue_map_url && !seenVenue.has(row.venue_map_url)) {
      seenVenue.add(row.venue_map_url);
      targets.push({
        entity: "venue",
        id: row.venue_name ?? row.venue_map_url,
        url: row.venue_map_url,
      });
    }
  }

  const settled = await runWithConcurrency(targets, LINK_CONCURRENCY, (t) => headOnce(t.url));

  const broken: BrokenLink[] = [];
  settled.forEach((res, i) => {
    const t = targets[i];
    if (res.status === "rejected") {
      broken.push({ entity: t.entity, id: t.id, url: t.url, status: "fetch_error" });
      return;
    }
    const status = res.value;
    if (typeof status === "number") {
      if (status >= 400) broken.push({ entity: t.entity, id: t.id, url: t.url, status });
    } else {
      broken.push({ entity: t.entity, id: t.id, url: t.url, status });
    }
  });

  return { checked: targets.length, broken };
}

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
