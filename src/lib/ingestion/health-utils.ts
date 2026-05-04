/**
 * Health utility functions for pipeline monitoring.
 *
 * Pure computation helpers (timezone, intervals, status) plus a
 * fire-and-forget logger that writes to `pipeline_health_logs`.
 */

import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Time helpers (WITA = UTC+8)
// ---------------------------------------------------------------------------

/** Returns the current hour (0-23) in Bali time (WITA, UTC+8). */
export function getBaliLocalHour(date: Date): number {
  return (date.getUTCHours() + 8) % 24;
}

/**
 * Returns true during Bali "active hours" — 7 AM to 10 PM WITA.
 * Active range: hour >= 7 && hour < 22.
 */
export function isActiveHours(date: Date): boolean {
  const hour = getBaliLocalHour(date);
  return hour >= 7 && hour < 22;
}

// ---------------------------------------------------------------------------
// Interval computation
// ---------------------------------------------------------------------------

/**
 * Computes the average interval (in minutes) between consecutive timestamps.
 *
 * - Accepts ISO 8601 timestamp strings.
 * - Sorts chronologically before computing intervals.
 * - Returns `null` if fewer than 2 timestamps are provided.
 */
export function computeAverageInterval(
  timestamps: string[],
): number | null {
  if (timestamps.length < 2) return null;

  const sorted = timestamps
    .map((ts) => new Date(ts).getTime())
    .sort((a, b) => a - b);

  let totalMs = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalMs += sorted[i] - sorted[i - 1];
  }

  const avgMs = totalMs / (sorted.length - 1);
  return avgMs / (1000 * 60); // convert ms -> minutes
}

// ---------------------------------------------------------------------------
// Channel status determination
// ---------------------------------------------------------------------------

/**
 * Determines a channel's health status based on the gap since the last
 * message and the average posting interval.
 *
 * Rules vary by time-of-day in Bali:
 *
 * **Active hours (7 AM - 10 PM WITA):**
 * - `error`   if gap > 12 h
 * - `warning` if gap > 3x average interval (or > 6 h when no average)
 * - `healthy` otherwise
 *
 * **Quiet hours (10 PM - 7 AM WITA):**
 * - `error`   if gap > 24 h
 * - `warning` if gap > 12 h
 * - `healthy` otherwise
 */
export function determineChannelStatus(
  lastMessageAt: string | null,
  avgIntervalMinutes: number | null,
  now: Date = new Date(),
): "healthy" | "warning" | "error" {
  if (!lastMessageAt) return "error";

  const gapMs = now.getTime() - new Date(lastMessageAt).getTime();
  const gapMinutes = gapMs / (1000 * 60);

  if (isActiveHours(now)) {
    // Active hours thresholds
    if (gapMinutes > 12 * 60) return "error";

    const warnThreshold =
      avgIntervalMinutes != null ? avgIntervalMinutes * 3 : 6 * 60;
    if (gapMinutes > warnThreshold) return "warning";
  } else {
    // Quiet hours thresholds
    if (gapMinutes > 24 * 60) return "error";
    if (gapMinutes > 12 * 60) return "warning";
  }

  return "healthy";
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

/**
 * Inserts a row into `pipeline_health_logs`. Fire-and-forget — errors are
 * caught and logged to the console rather than thrown.
 */
export async function logHealthEvent(
  supabase: SupabaseClient,
  entry: {
    log_type: string;
    channel?: string;
    group_name?: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from("pipeline_health_logs").insert({
      log_type: entry.log_type,
      channel: entry.channel ?? null,
      group_name: entry.group_name ?? null,
      message: entry.message,
      metadata: entry.metadata ?? {},
    });

    if (error) {
      console.error("[health-utils] Failed to insert health log:", error);
    }
  } catch (err) {
    console.error("[health-utils] Unexpected error logging health event:", err);
  }
}
