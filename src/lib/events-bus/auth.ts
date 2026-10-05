import { createHmac, timingSafeEqual } from "crypto";

/**
 * The events-bus routes (`/api/cron/events-bus/*`) have their own key, derived
 * one-way from CRON_SECRET, so the private bus repo `Benji-cpu/ubudian-events-bus`
 * never holds the site-wide secret. A leak of this value can only do what these
 * routes do: queue events through the gate, set the week's picks, store a
 * report, read the export. Same pattern as `src/lib/venue/review-auth.ts`.
 * Compute it with `scripts/events-bus-token.ts`.
 */
export function eventsBusToken(cronSecret: string | undefined): string | null {
  if (!cronSecret) return null;
  return createHmac("sha256", cronSecret).update("ubudian:events-bus:v1").digest("hex");
}

export function isEventsBusAuthorised(
  authHeader: string | null,
  cronSecret: string | undefined = process.env.CRON_SECRET,
): boolean {
  const expected = eventsBusToken(cronSecret);
  if (!expected || !authHeader?.startsWith("Bearer ")) return false;
  const given = Buffer.from(authHeader.slice(7));
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}
