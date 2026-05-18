import { after } from "next/server";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SponsorshipEventType } from "@/types";

/**
 * Fire-and-forget impression / profile-view tracker. Called from the server
 * component that renders the surface; uses Next's `after()` so the page never
 * waits on this write.
 *
 * Dedupe key = sha256(coarse-ip + utc-date + sponsor_id + event_type). Same
 * visitor refreshing the same page on the same day counts once. The partial
 * unique index on (sponsor_id, event_type, dedupe_key) in SQL turns repeat
 * writes into no-ops via onConflict=ignore.
 */
export function recordSponsorshipEvent({
  sponsorId,
  eventType,
  contextEntityType,
  contextEntityId,
}: {
  sponsorId: string;
  eventType: SponsorshipEventType;
  contextEntityType?: string;
  contextEntityId?: string;
}) {
  after(async () => {
    try {
      const hdrs = await headers();
      const ip = clientIp(hdrs);
      const day = new Date().toISOString().split("T")[0];
      const dedupeKey = createHash("sha256")
        .update(`${ip}|${day}|${sponsorId}|${eventType}`)
        .digest("hex")
        .slice(0, 32);

      const admin = createAdminClient();
      await admin
        .from("sponsorship_events")
        .upsert(
          {
            sponsor_id: sponsorId,
            event_type: eventType,
            context_entity_type: contextEntityType ?? null,
            context_entity_id: contextEntityId ?? null,
            dedupe_key: dedupeKey,
          },
          { onConflict: "sponsor_id,event_type,dedupe_key", ignoreDuplicates: true }
        );
    } catch (err) {
      // Non-blocking; analytics is best-effort.
      console.error("[sponsorship-analytics] write failed:", err);
    }
  });
}

function clientIp(hdrs: Headers): string {
  const fwd = hdrs.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return hdrs.get("x-real-ip") ?? "unknown";
}
