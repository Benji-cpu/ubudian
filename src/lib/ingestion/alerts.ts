/**
 * Health checks for the ingestion pipeline.
 *
 * Reports (to the activity log, which /admin renders — never to email) when:
 * - A source fails multiple times in a row
 * - The dedup review queue exceeds a threshold
 * - No events have been ingested in the last 24 hours
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeAverageInterval,
  determineChannelStatus,
  logHealthEvent,
} from "./health-utils";
import { logActivity } from "./activity-log";
import { nowInBali } from "@/lib/events/bali-time";

const DEDUP_QUEUE_THRESHOLD = 20;

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

  // Check 5: Quiet groups (no messages in 6+ hours during Ubud daytime)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get groups that were active in last 7 days
  const { data: activeGroups } = await supabase
    .from("raw_ingestion_messages")
    .select("chat_name, source_id")
    .not("chat_name", "is", null)
    .gte("created_at", sevenDaysAgo);

  if (activeGroups?.length) {
    // Get distinct groups
    const groupKeys = new Set<string>();
    const groupInfo = new Map<string, { chatName: string; sourceId: string }>();
    for (const msg of activeGroups) {
      const key = `${msg.source_id}::${msg.chat_name}`;
      if (!groupKeys.has(key)) {
        groupKeys.add(key);
        groupInfo.set(key, { chatName: msg.chat_name, sourceId: msg.source_id });
      }
    }

    // Check which groups have been quiet for 6+ hours
    for (const [, info] of groupInfo) {
      const { data: recentMsgs } = await supabase
        .from("raw_ingestion_messages")
        .select("created_at")
        .eq("source_id", info.sourceId)
        .eq("chat_name", info.chatName)
        .gte("created_at", sixHoursAgo)
        .limit(1);

      if (!recentMsgs?.length) {
        // Get last message time for this group
        const { data: lastMsg } = await supabase
          .from("raw_ingestion_messages")
          .select("created_at")
          .eq("source_id", info.sourceId)
          .eq("chat_name", info.chatName)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastMessageAt = lastMsg?.[0]?.created_at;
        const hoursSilent = lastMessageAt
          ? Math.round((Date.now() - new Date(lastMessageAt).getTime()) / (60 * 60 * 1000))
          : null;

        await logActivity({
          category: "group_quiet",
          severity: "warning",
          title: `${info.chatName} quiet for ${hoursSilent ?? "unknown"}h`,
          details: {
            chat_name: info.chatName,
            last_message_at: lastMessageAt ?? null,
            hours_silent: hoursSilent,
          },
          sourceId: info.sourceId,
        });

        issues.push(`Group "${info.chatName}" has been quiet for ${hoursSilent ?? "6+"}h`);
      }
    }
  }

  // Issues go to the activity log, which /admin renders — not to email.
  // Until 2026-09-21 this sent an "[Ingestion Alert] N issues detected" mail on
  // every run that found anything, plus a Sunday summary. That was 34 emails in
  // the last month to an inbox that also carries the client alerts Ben actually
  // reads, and most of them were "group X quiet for 7h", which is what a WhatsApp
  // group does overnight. Genuine breakage still has a channel: it is logged here
  // with severity, and the nightly maintenance workflow raises a CRM handover when
  // the site goes stale or moderation backs up.
  for (const issue of issues) {
    // Quiet groups log themselves above, with the source id attached.
    if (issue.startsWith('Group "')) continue;
    await logActivity({ category: "source_error", severity: "warning", title: issue });
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}

/**
 * Archive pending events whose start_date is in the past (Bali wall clock).
 * Recurring rows are left alone — their start_date is a seed the renderer
 * rolls forward, so a past seed is normal and must not trigger archive.
 * Returns the number of events archived.
 */
export async function archivePastPendingEvents(): Promise<number> {
  const supabase = createAdminClient();
  const today = nowInBali().dateStr;
  const { data, error } = await supabase
    .from("events")
    .update({ status: "archived" })
    .eq("status", "pending")
    .eq("is_recurring", false)
    .lt("start_date", today)
    .not("start_date", "is", null)
    .select("id");

  if (error) {
    console.error("[archivePastPendingEvents] Error:", error);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Archive approved single-occurrence events whose start_date AND end_date
 * are in the past (Bali wall clock). Recurring events and multi-day events
 * with a future end_date are left alone.
 *
 * The /events page hides these from users via an in-memory filter, but they
 * still pollute admin views and dedup matching. This keeps the approved set
 * drained going forward; one-time cleanup of the historical backlog lives
 * in migration `20260520070000_archive_stale_approved_events.sql`.
 */
export async function archivePastApprovedEvents(): Promise<number> {
  const supabase = createAdminClient();
  const today = nowInBali().dateStr;
  const { data, error } = await supabase
    .from("events")
    .update({ status: "archived", moderation_reason: `archived_past_date_${today}` })
    .eq("status", "approved")
    .eq("is_recurring", false)
    .lt("start_date", today)
    .or(`end_date.is.null,end_date.lt.${today}`)
    .select("id");

  if (error) {
    console.error("[archivePastApprovedEvents] Error:", error);
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
