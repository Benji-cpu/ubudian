/**
 * GET /api/cron/daily-maintenance
 *
 * Single CRON_SECRET-gated endpoint that powers the daily remote scheduled
 * agent. Runs autonomous cleanups (idempotent), then assembles a review
 * queue of items that need human or agent attention. Returns one JSON blob
 * the caller can use to drive a digest email + per-item PR creation.
 *
 * This endpoint is NOT registered in vercel.json — Vercel Hobby caps cron
 * jobs at 2 (already used by ingest-events and ingestion-health). It is
 * called externally by the remote scheduled agent on Anthropic infra.
 */
import { NextResponse } from "next/server";
import { archivePastPendingEvents } from "@/lib/ingestion/alerts";
import {
  archiveFuzzyDuplicateEvents,
  cancelStaleBookings,
  purgeFailedMessages,
} from "@/lib/maintenance/cleanups";
import { buildReviewQueue } from "@/lib/maintenance/review-queue";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  const archivedPending = await archivePastPendingEvents().catch((err) => {
    errors.push(`archivePastPendingEvents: ${err?.message ?? String(err)}`);
    return 0;
  });
  const purgedMessages = await purgeFailedMessages().catch((err) => {
    errors.push(`purgeFailedMessages: ${err?.message ?? String(err)}`);
    return 0;
  });
  const cancelledBookings = await cancelStaleBookings().catch((err) => {
    errors.push(`cancelStaleBookings: ${err?.message ?? String(err)}`);
    return 0;
  });
  const archivedDuplicates = await archiveFuzzyDuplicateEvents().catch((err) => {
    errors.push(`archiveFuzzyDuplicateEvents: ${err?.message ?? String(err)}`);
    return 0;
  });

  const review = await buildReviewQueue().catch((err) => {
    errors.push(`buildReviewQueue: ${err?.message ?? String(err)}`);
    return null;
  });

  return NextResponse.json({
    startedAt,
    finishedAt: new Date().toISOString(),
    autonomous: {
      archivedPendingEvents: archivedPending,
      purgedFailedMessages: purgedMessages,
      cancelledStaleBookings: cancelledBookings,
      archivedDuplicateEvents: archivedDuplicates,
    },
    review,
    errors,
  });
}
