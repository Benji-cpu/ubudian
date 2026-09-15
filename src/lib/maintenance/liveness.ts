/**
 * Is the site still receiving events? The one question the digest must answer
 * loudly, because every other failure here has been quiet: the approver
 * trigger was disabled for eight weeks before anyone noticed 649 events had
 * expired unpublished.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export const LIVENESS_STALE_HOURS = 48;

export interface Liveness {
  /** ISO timestamp of the newest auto-published row, or null if none ever. */
  lastPublishedAt: string | null;
  hoursSincePublish: number | null;
  /** Approved rows created by the harvesters in the last 24h — supply, not just the gate. */
  createdLast24h: number;
  stale: boolean;
  /** Human sentence for the digest. */
  line: string;
}

export async function checkLiveness(now: Date = new Date()): Promise<Liveness> {
  const supabase = createAdminClient();
  const [{ data: last }, { count: created }] = await Promise.all([
    supabase
      .from("events")
      .select("auto_approved_at")
      .not("auto_approved_at", "is", null)
      .order("auto_approved_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(now.getTime() - 24 * 3_600_000).toISOString()),
  ]);

  const lastPublishedAt = (last as { auto_approved_at: string } | null)?.auto_approved_at ?? null;
  const hoursSincePublish = lastPublishedAt
    ? Math.round((now.getTime() - new Date(lastPublishedAt).getTime()) / 3_600_000)
    : null;
  const stale = hoursSincePublish === null || hoursSincePublish > LIVENESS_STALE_HOURS;
  const line = stale
    ? `STALE: nothing has been published for ${hoursSincePublish ?? "∞"} hours (${created ?? 0} events harvested in the last 24h). The gate or the harvesters have stopped.`
    : `Live: last publish ${hoursSincePublish}h ago, ${created ?? 0} events harvested in the last 24h.`;

  return { lastPublishedAt, hoursSincePublish, createdLast24h: created ?? 0, stale, line };
}
