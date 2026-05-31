/**
 * GET /api/cron/ingestion-health
 *
 * Vercel Cron Job for health monitoring.
 * Runs daily to check source health and send alerts.
 *
 * Protected by CRON_SECRET header.
 */

import { NextResponse } from "next/server";
import {
  runHealthCheck,
  archivePastPendingEvents,
  archivePastApprovedEvents,
  computeSmartHealthMetrics,
} from "@/lib/ingestion/alerts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runHealthCheck();
    const archived = await archivePastPendingEvents();
    // Second daily sweep of past approved events (the daily-maintenance run is
    // the primary one). Redundant-by-design: if that run's archival step throws
    // transiently it reports "0 archived" and leaves stale rows for a full day,
    // so this 30-min-later net catches the miss. Both helpers are idempotent.
    const archivedApproved = await archivePastApprovedEvents();
    const smartMetrics = await computeSmartHealthMetrics();
    return NextResponse.json({
      ...result,
      archivedCount: archived,
      archivedApprovedCount: archivedApproved,
      smartMetrics,
    });
  } catch (err) {
    console.error("[cron/ingestion-health] Error:", err);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
