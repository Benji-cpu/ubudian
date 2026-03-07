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
