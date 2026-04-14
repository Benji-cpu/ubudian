/**
 * GET /api/cron/ingestion-health
 *
 * Vercel Cron Job for health monitoring.
 * Runs daily to check source health and send alerts.
 *
 * Protected by CRON_SECRET header.
 */

import { NextResponse } from "next/server";
import { runHealthCheck, archivePastPendingEvents } from "@/lib/ingestion/alerts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runHealthCheck();
    const archived = await archivePastPendingEvents();
    return NextResponse.json({ ...result, archivedCount: archived });
  } catch (err) {
    console.error("[cron/ingestion-health] Error:", err);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
