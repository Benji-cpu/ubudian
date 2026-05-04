/**
 * Daily refresher: re-fetches source URLs for approved upcoming events
 * to keep volatile fields (cover image, price, ticket URL) up to date and
 * archive listings that have been removed.
 *
 * Designed to run within a tight time budget (Vercel Hobby cron caps at 10s).
 * Prioritizes least-recently-refreshed events via the
 * `events_refresh_queue_idx` partial index.
 *
 * v1 handles Megatix-linked events (most volatile / highest signal). Other
 * sources can be added by extending `refreshOne()`.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEventDetail } from "@/lib/ingestion/adapters/megatix";
import { logActivity } from "@/lib/ingestion/activity-log";

const MEGATIX_HOST = "megatix.co.id";
const DEFAULT_FETCH_DELAY_MS = 750;

export interface RefreshOptions {
  budgetMs?: number;
  limit?: number;
  fetchDelayMs?: number;
  onlyEventId?: string;
  dryRun?: boolean;
}

export interface RefreshOneResult {
  eventId: string;
  title: string;
  status:
    | "updated"
    | "no_changes"
    | "archived_404"
    | "skipped_unsupported"
    | "error"
    | "would_update";
  changedFields?: string[];
  error?: string;
}

export interface RefreshSummary {
  processed: number;
  updated: number;
  noChanges: number;
  archived: number;
  skipped: number;
  errors: number;
  results: RefreshOneResult[];
}

/**
 * Extract a Megatix event slug from a URL like
 * `https://megatix.co.id/events/dissolve-eros?source=home`.
 */
export function extractMegatixSlug(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(MEGATIX_HOST)) return null;
    const m = u.pathname.match(/^\/events\/([^/]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

interface CandidateEvent {
  id: string;
  title: string;
  source_url: string | null;
  external_ticket_url: string | null;
  cover_image_url: string | null;
  price_info: string | null;
  organizer_name: string | null;
  venue_address: string | null;
  start_date: string;
}

const SELECT_COLS =
  "id, title, source_url, external_ticket_url, cover_image_url, price_info, organizer_name, venue_address, start_date";

export async function refreshLinkedEvents(
  options: RefreshOptions = {}
): Promise<RefreshSummary> {
  const startedAt = Date.now();
  const budgetMs = options.budgetMs ?? Infinity;
  const limit = options.limit ?? 25;
  const fetchDelayMs = options.fetchDelayMs ?? DEFAULT_FETCH_DELAY_MS;
  const supabase = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("events")
    .select(SELECT_COLS)
    .eq("status", "approved")
    .gte("start_date", today)
    // Either canonical source_url OR a ticket URL is enough to refresh
    .or("source_url.not.is.null,external_ticket_url.not.is.null")
    .order("last_refreshed_at", { ascending: true, nullsFirst: true });

  if (options.onlyEventId) {
    query = supabase.from("events").select(SELECT_COLS).eq("id", options.onlyEventId);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`refreshLinkedEvents load error: ${error.message}`);
  }

  const candidates = (data ?? []) as CandidateEvent[];
  const summary: RefreshSummary = {
    processed: 0,
    updated: 0,
    noChanges: 0,
    archived: 0,
    skipped: 0,
    errors: 0,
    results: [],
  };

  for (let i = 0; i < candidates.length; i++) {
    if (Date.now() - startedAt > budgetMs) break;

    const evt = candidates[i];
    summary.processed++;

    let result: RefreshOneResult;
    try {
      result = await refreshOne(evt, options.dryRun ?? false);
    } catch (err) {
      result = {
        eventId: evt.id,
        title: evt.title,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      };
    }

    summary.results.push(result);
    switch (result.status) {
      case "updated":
      case "would_update":
        summary.updated++;
        break;
      case "no_changes":
        summary.noChanges++;
        break;
      case "archived_404":
        summary.archived++;
        break;
      case "skipped_unsupported":
        summary.skipped++;
        break;
      case "error":
        summary.errors++;
        break;
    }

    // Throttle between events to be polite to upstream APIs (skip last + dry-run)
    if (
      !options.dryRun &&
      i < candidates.length - 1 &&
      Date.now() - startedAt + fetchDelayMs < budgetMs
    ) {
      await delay(fetchDelayMs);
    }
  }

  return summary;
}

async function refreshOne(
  event: CandidateEvent,
  dryRun: boolean
): Promise<RefreshOneResult> {
  const supabase = createAdminClient();
  const url = event.source_url || event.external_ticket_url;
  const slug = extractMegatixSlug(url);

  if (!slug) {
    // Stamp last_refreshed_at so we don't keep retrying unsupported sources.
    if (!dryRun) {
      await supabase
        .from("events")
        .update({ last_refreshed_at: new Date().toISOString() })
        .eq("id", event.id);
    }
    return {
      eventId: event.id,
      title: event.title,
      status: "skipped_unsupported",
    };
  }

  // Fetch fresh detail from Megatix
  let detail;
  try {
    detail = await fetchEventDetail(slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Treat 404 as "this listing was removed" → archive
    if (/\b404\b/.test(msg)) {
      if (!dryRun) {
        await supabase
          .from("events")
          .update({
            status: "archived",
            last_refreshed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.id);
        await logActivity({
          category: "event_enriched",
          severity: "warning",
          title: `Archived event after Megatix 404: ${event.title}`,
          details: { event_id: event.id, slug, source_url: url },
        });
      }
      return { eventId: event.id, title: event.title, status: "archived_404" };
    }
    return {
      eventId: event.id,
      title: event.title,
      status: "error",
      error: msg,
    };
  }

  const eventUrl = `https://megatix.co.id/events/${slug}`;
  const incomingCover = detail.cover ?? null;
  const incomingTicketUrl = eventUrl;
  const incomingPriceInfo = detail.display_price ?? null;
  const incomingOrganizer = detail.promoter_name ?? null;
  const incomingVenueAddress = detail.venue?.full_address ?? null;

  const update: Record<string, unknown> = {};
  const changed: string[] = [];

  // Volatile fields: ALWAYS overwrite if upstream has a value (cover changes weekly).
  if (incomingCover && incomingCover !== event.cover_image_url) {
    update.cover_image_url = incomingCover;
    changed.push("cover_image_url");
  }
  if (incomingPriceInfo && incomingPriceInfo !== event.price_info) {
    update.price_info = incomingPriceInfo;
    changed.push("price_info");
  }
  if (incomingTicketUrl && incomingTicketUrl !== event.external_ticket_url) {
    update.external_ticket_url = incomingTicketUrl;
    changed.push("external_ticket_url");
  }

  // Stable fields: only fill nulls (preserve any manual admin edits).
  if (incomingOrganizer && !event.organizer_name) {
    update.organizer_name = incomingOrganizer;
    changed.push("organizer_name");
  }
  if (incomingVenueAddress && !event.venue_address) {
    update.venue_address = incomingVenueAddress;
    changed.push("venue_address");
  }

  if (changed.length === 0) {
    if (!dryRun) {
      await supabase
        .from("events")
        .update({ last_refreshed_at: new Date().toISOString() })
        .eq("id", event.id);
    }
    return { eventId: event.id, title: event.title, status: "no_changes" };
  }

  if (dryRun) {
    return {
      eventId: event.id,
      title: event.title,
      status: "would_update",
      changedFields: changed,
    };
  }

  update.last_refreshed_at = new Date().toISOString();
  update.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("events")
    .update(update)
    .eq("id", event.id);

  if (updateError) {
    return {
      eventId: event.id,
      title: event.title,
      status: "error",
      error: updateError.message,
    };
  }

  await logActivity({
    category: "event_enriched",
    title: `Refreshed from Megatix: ${changed.join(", ")}`,
    details: {
      event_id: event.id,
      event_title: event.title,
      slug,
      changed_fields: changed,
    },
  });

  return {
    eventId: event.id,
    title: event.title,
    status: "updated",
    changedFields: changed,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
