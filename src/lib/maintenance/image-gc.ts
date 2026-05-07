/**
 * Image garbage collection for archived events.
 *
 * The Ubudian preserves event TEXT indefinitely (the corpus is the asset for
 * AI co-curation), but doesn't need to keep cover images for events that are
 * archived and old. This module decides what to GC and exposes a runner that
 * the daily-maintenance cron invokes.
 *
 * Pure helpers (`shouldGarbageCollectEventImage`, `parseStorageObjectPath`)
 * are unit-tested in isolation. The I/O runner lives below them.
 */

const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/images/";
const EVENTS_PATH_PREFIX = `${STORAGE_PUBLIC_PREFIX}events/`;
const DEFAULT_AGE_THRESHOLD_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ImageGcCandidate = {
  id: string;
  status: string;
  start_date: string | null;
  cover_image_url: string | null;
};

export function shouldGarbageCollectEventImage(
  event: ImageGcCandidate,
  now: Date,
  supabaseProjectRef: string,
  ageThresholdDays = DEFAULT_AGE_THRESHOLD_DAYS,
): boolean {
  if (event.status !== "archived") return false;
  if (!event.cover_image_url) return false;

  let parsed: URL;
  try {
    parsed = new URL(event.cover_image_url);
  } catch {
    return false;
  }

  if (parsed.hostname !== `${supabaseProjectRef}.supabase.co`) return false;
  if (!parsed.pathname.startsWith(EVENTS_PATH_PREFIX)) return false;

  if (event.start_date) {
    const start = new Date(`${event.start_date}T00:00:00Z`);
    if (Number.isNaN(start.getTime())) return false;
    const ageMs = now.getTime() - start.getTime();
    if (ageMs < ageThresholdDays * MS_PER_DAY) return false;
  }

  return true;
}

export function parseStorageObjectPath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const idx = parsed.pathname.indexOf(STORAGE_PUBLIC_PREFIX);
  if (idx === -1) return null;
  const after = parsed.pathname.slice(idx + STORAGE_PUBLIC_PREFIX.length);
  return after || null;
}

/**
 * Derive the Supabase project ref from NEXT_PUBLIC_SUPABASE_URL — the hostname
 * is `<ref>.supabase.co`. Returns null if env is unset or malformed.
 */
function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([^.]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export type ImageGcResult = {
  scanned: number;
  collected: number;
  errors: string[];
};

/**
 * Sweep `events` rows with status='archived', start_date older than 90 days,
 * and a cover_image_url pointing into our own Supabase storage bucket. For
 * each, delete the storage object, null out cover_image_url, and log the
 * deletion to image_gc_log for audit.
 *
 * Idempotent — re-running is a no-op once the URL has been nulled. Failures
 * on a single row are recorded in `errors[]` and don't abort the sweep.
 */
export async function garbageCollectArchivedEventImages(
  ageThresholdDays = DEFAULT_AGE_THRESHOLD_DAYS,
  batchLimit = 200,
): Promise<ImageGcResult> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const projectRef = getProjectRef();

  if (!projectRef) {
    return { scanned: 0, collected: 0, errors: ["NEXT_PUBLIC_SUPABASE_URL missing or malformed"] };
  }

  const cutoff = new Date(Date.now() - ageThresholdDays * MS_PER_DAY)
    .toISOString()
    .split("T")[0];

  const { data: rows, error } = await supabase
    .from("events")
    .select("id, status, start_date, cover_image_url")
    .eq("status", "archived")
    .not("cover_image_url", "is", null)
    .lt("start_date", cutoff)
    .limit(batchLimit);

  if (error) {
    return { scanned: 0, collected: 0, errors: [`fetch: ${error.message}`] };
  }

  const candidates = (rows ?? []) as ImageGcCandidate[];
  const now = new Date();
  const errors: string[] = [];
  let collected = 0;

  for (const event of candidates) {
    if (!shouldGarbageCollectEventImage(event, now, projectRef, ageThresholdDays)) continue;
    const path = event.cover_image_url ? parseStorageObjectPath(event.cover_image_url) : null;
    if (!path) continue;

    const { error: storageErr } = await supabase.storage.from("images").remove([path]);
    if (storageErr) {
      errors.push(`storage delete ${event.id}: ${storageErr.message}`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("events")
      .update({ cover_image_url: null })
      .eq("id", event.id);
    if (updateErr) {
      errors.push(`row update ${event.id}: ${updateErr.message}`);
      continue;
    }

    const { error: logErr } = await supabase.from("image_gc_log").insert({
      entity_type: "event",
      entity_id: event.id,
      storage_path: path,
      original_url: event.cover_image_url,
    });
    if (logErr) {
      errors.push(`log ${event.id}: ${logErr.message}`);
      // Don't bail — the GC succeeded; missing log entry is non-blocking.
    }

    collected += 1;
  }

  return { scanned: candidates.length, collected, errors };
}
