/**
 * Health alerts for the ingestion pipeline.
 *
 * Sends email alerts via Resend when:
 * - A source fails multiple times in a row
 * - The dedup review queue exceeds a threshold
 * - No events have been ingested in the last 24 hours
 */

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeAverageInterval,
  determineChannelStatus,
  logHealthEvent,
} from "./health-utils";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@theubudian.com";
const DEDUP_QUEUE_THRESHOLD = 20;

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface HealthCheckResult {
  healthy: boolean;
  issues: string[];
}

/**
 * Run all health checks and send alerts if needed.
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
  const supabase = createAdminClient();
  const issues: string[] = [];

  // Check 1: Sources with recent failures
  const { data: failedSources } = await supabase
    .from("event_sources")
    .select("name, last_error")
    .eq("is_enabled", true)
    .not("last_error", "is", null);

  if (failedSources?.length) {
    for (const s of failedSources) {
      issues.push(`Source "${s.name}" has error: ${s.last_error}`);
    }
  }

  // Check 2: Failed runs in last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: failedRuns, error: runsError } = await supabase
    .from("ingestion_runs")
    .select("id")
    .eq("status", "failed")
    .gte("started_at", twentyFourHoursAgo);

  if (!runsError && failedRuns && failedRuns.length > 3) {
    issues.push(`${failedRuns.length} failed ingestion runs in the last 24 hours`);
  }

  // Check 3: Dedup queue size
  const { count: dedupCount } = await supabase
    .from("dedup_matches")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (dedupCount && dedupCount > DEDUP_QUEUE_THRESHOLD) {
    issues.push(`Dedup review queue has ${dedupCount} pending matches (threshold: ${DEDUP_QUEUE_THRESHOLD})`);
  }

  // Check 4: No ingestion activity in 24 hours
  const { data: recentRuns } = await supabase
    .from("ingestion_runs")
    .select("id")
    .gte("started_at", twentyFourHoursAgo)
    .limit(1);

  const { data: enabledNonPush } = await supabase
    .from("event_sources")
    .select("id")
    .eq("is_enabled", true)
    .not("source_type", "in", '("telegram","whatsapp")')
    .limit(1);

  if ((!recentRuns || recentRuns.length === 0) && enabledNonPush?.length) {
    issues.push("No ingestion runs in the last 24 hours — cron may be down");
  }

  // Send alert if there are issues
  if (issues.length > 0) {
    await sendHealthAlert(issues);
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}

/**
 * Archive all pending events whose start_date is in the past.
 * Returns the number of events archived.
 */
export async function archivePastPendingEvents(): Promise<number> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const { data, error } = await supabase
    .from("events")
    .update({ status: "archived" })
    .eq("status", "pending")
    .lt("start_date", today)
    .not("start_date", "is", null)
    .select("id");

  if (error) {
    console.error("[archivePastPendingEvents] Error:", error);
    return 0;
  }
  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Smart per-group health metrics
// ---------------------------------------------------------------------------

export interface SmartHealthChannel {
  channel: string;
  group_name: string | null;
  status: "healthy" | "warning" | "error";
  last_message_at: string | null;
  avg_interval_minutes: number | null;
}

export interface SmartHealthMetrics {
  channels: SmartHealthChannel[];
  issues: string[];
}

/**
 * Compute per-group health metrics from the last 7 days of messages.
 *
 * For each group: determine channel status using message interval analysis.
 * For scraper (non-push) sources: also check ingestion_runs for staleness.
 * Logs results to `pipeline_health_logs`.
 */
export async function computeSmartHealthMetrics(): Promise<SmartHealthMetrics> {
  const supabase = createAdminClient();
  const channels: SmartHealthChannel[] = [];
  const issues: string[] = [];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all messages from the last 7 days with source info
    const { data: messages, error: msgError } = await supabase
      .from("raw_ingestion_messages")
      .select("chat_name, source_id, created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });

    if (msgError) {
      issues.push(`Failed to query messages: ${msgError.message}`);
      return { channels, issues };
    }

    // Fetch all enabled sources to map source_id -> source_type
    const { data: sources } = await supabase
      .from("event_sources")
      .select("id, source_type, name")
      .eq("is_enabled", true);

    const sourceMap = new Map<string, { source_type: string; name: string }>();
    for (const s of sources ?? []) {
      sourceMap.set(s.id, { source_type: s.source_type, name: s.name });
    }

    // Group messages by (chat_name, source_id)
    const groups = new Map<string, { chat_name: string | null; source_id: string; timestamps: string[] }>();

    for (const msg of messages ?? []) {
      const key = `${msg.source_id}::${msg.chat_name ?? "__no_chat__"}`;
      if (!groups.has(key)) {
        groups.set(key, {
          chat_name: msg.chat_name,
          source_id: msg.source_id,
          timestamps: [],
        });
      }
      groups.get(key)!.timestamps.push(msg.created_at);
    }

    // Evaluate each group
    for (const [, group] of groups) {
      const sourceInfo = sourceMap.get(group.source_id);
      const sourceType = sourceInfo?.source_type ?? "unknown";

      // Map source_type to channel name
      let channelName: string;
      if (sourceType === "telegram") channelName = "telegram";
      else if (sourceType === "whatsapp") channelName = "whatsapp";
      else channelName = "megatix";

      const avgInterval = computeAverageInterval(group.timestamps);
      const lastMessageAt = group.timestamps.length > 0
        ? group.timestamps[group.timestamps.length - 1]
        : null;

      const status = determineChannelStatus(lastMessageAt, avgInterval);

      channels.push({
        channel: channelName,
        group_name: group.chat_name,
        status,
        last_message_at: lastMessageAt,
        avg_interval_minutes: avgInterval,
      });

      if (status === "warning" || status === "error") {
        const label = group.chat_name ? `${channelName}/${group.chat_name}` : channelName;
        issues.push(`${label}: ${status} — last message at ${lastMessageAt ?? "never"}`);
      }
    }

    // Check scraper (non-push) sources for staleness
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

    const { data: scraperSources } = await supabase
      .from("event_sources")
      .select("id, name, last_fetched_at")
      .eq("is_enabled", true)
      .not("source_type", "in", '("telegram","whatsapp")');

    for (const scraper of scraperSources ?? []) {
      // Warn if last fetch > 5h ago
      if (!scraper.last_fetched_at || scraper.last_fetched_at < fiveHoursAgo) {
        issues.push(`Scraper "${scraper.name}": last fetch was ${scraper.last_fetched_at ?? "never"} (>5h ago)`);
      }

      // Check for 0 events in 2+ consecutive runs
      const { data: recentRuns } = await supabase
        .from("ingestion_runs")
        .select("events_created")
        .eq("source_id", scraper.id)
        .order("started_at", { ascending: false })
        .limit(2);

      if (
        recentRuns &&
        recentRuns.length >= 2 &&
        recentRuns.every((r) => (r.events_created ?? 0) === 0)
      ) {
        issues.push(`Scraper "${scraper.name}": 0 events in last ${recentRuns.length} consecutive runs`);
      }
    }

    // Log results to pipeline_health_logs
    for (const ch of channels) {
      if (ch.status === "warning" || ch.status === "error") {
        await logHealthEvent(supabase, {
          log_type: ch.status,
          channel: ch.channel,
          group_name: ch.group_name ?? undefined,
          message: `Channel ${ch.status}: last message at ${ch.last_message_at ?? "never"}, avg interval ${ch.avg_interval_minutes?.toFixed(1) ?? "N/A"} min`,
          metadata: {
            last_message_at: ch.last_message_at,
            avg_interval_minutes: ch.avg_interval_minutes,
          },
        });
      }
    }

    // Log a summary if everything is healthy
    const unhealthyCount = channels.filter((c) => c.status !== "healthy").length;
    if (unhealthyCount === 0 && channels.length > 0) {
      await logHealthEvent(supabase, {
        log_type: "info",
        message: `All ${channels.length} channel(s) healthy`,
        metadata: { channel_count: channels.length },
      });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error in smart health metrics";
    issues.push(errMsg);
    console.error("[alerts] computeSmartHealthMetrics error:", err);
  }

  return { channels, issues };
}

/**
 * Send a health alert email via Resend.
 */
async function sendHealthAlert(issues: string[]): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[alerts] RESEND_API_KEY not configured, skipping email alert");
    console.warn("[alerts] Issues:", issues);
    return;
  }

  try {
    const r = getResend();
    await r.emails.send({
      from: "The Ubudian <alerts@theubudian.com>",
      to: ADMIN_EMAIL,
      subject: `[Ingestion Alert] ${issues.length} issue${issues.length > 1 ? "s" : ""} detected`,
      html: `
        <h2>Ingestion Pipeline Health Alert</h2>
        <p>The following issues were detected during the health check:</p>
        <ul>
          ${issues.map((i) => `<li>${i}</li>`).join("")}
        </ul>
        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://theubudian.com"}/admin/ingestion">
            View Ingestion Dashboard
          </a>
        </p>
      `,
    });
  } catch (err) {
    console.error("[alerts] Failed to send health alert email:", err);
  }
}
