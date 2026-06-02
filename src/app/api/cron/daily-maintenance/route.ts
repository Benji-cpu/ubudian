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
import { archivePastApprovedEvents, archivePastPendingEvents } from "@/lib/ingestion/alerts";
import {
  archiveFuzzyDuplicateEvents,
  archiveStaleTicketedEvents,
  cancelStaleBookings,
  checkExternalLinkHealth,
  purgeFailedMessages,
  type LinkHealthReport,
  type StaleSweepResult,
} from "@/lib/maintenance/cleanups";
import { garbageCollectArchivedEventImages, type ImageGcResult } from "@/lib/maintenance/image-gc";
import { ensureTelegramWebhook, type TelegramWebhookHealth } from "@/lib/maintenance/telegram-webhook-health";
import { buildReviewQueue } from "@/lib/maintenance/review-queue";
import { sendTransactionalEmail } from "@/lib/email";
import { dailyMaintenanceDigest } from "@/lib/email-templates";

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
  const archivedApproved = await archivePastApprovedEvents().catch((err) => {
    errors.push(`archivePastApprovedEvents: ${err?.message ?? String(err)}`);
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
  const imageGc: ImageGcResult = await garbageCollectArchivedEventImages().catch((err) => {
    errors.push(`garbageCollectArchivedEventImages: ${err?.message ?? String(err)}`);
    return { scanned: 0, collected: 0, errors: [] };
  });
  if (imageGc.errors.length) errors.push(...imageGc.errors.map((e) => `imageGc: ${e}`));

  const telegramWebhook: TelegramWebhookHealth = await ensureTelegramWebhook().catch((err) => {
    errors.push(`ensureTelegramWebhook: ${err?.message ?? String(err)}`);
    return { checked: false, action: "error" as const, reason: err?.message ?? String(err) };
  });
  if (telegramWebhook.action === "error" && telegramWebhook.reason) {
    errors.push(`telegramWebhook: ${telegramWebhook.reason}`);
  }

  const linkHealth: LinkHealthReport = await checkExternalLinkHealth().catch((err) => {
    errors.push(`checkExternalLinkHealth: ${err?.message ?? String(err)}`);
    return { checked: 0, broken: [] };
  });

  // Auto-resolve the past-edition ("stale") links the check just found:
  // archive non-recurring phantoms, clear the dead CTA on recurring rows. Runs
  // off the report above so the agenda never carries a dead ticket link for
  // more than a day. Only touches status==="stale", never transient failures.
  const staleSweep: StaleSweepResult = await archiveStaleTicketedEvents(linkHealth).catch(
    (err) => {
      errors.push(`archiveStaleTicketedEvents: ${err?.message ?? String(err)}`);
      return { archived: 0, clearedCtas: 0, errors: [] };
    },
  );
  if (staleSweep.errors.length) errors.push(...staleSweep.errors);

  const review = await buildReviewQueue(linkHealth).catch((err) => {
    errors.push(`buildReviewQueue: ${err?.message ?? String(err)}`);
    return null;
  });

  const payload = {
    startedAt,
    finishedAt: new Date().toISOString(),
    autonomous: {
      archivedPendingEvents: archivedPending,
      archivedApprovedEvents: archivedApproved,
      purgedFailedMessages: purgedMessages,
      cancelledStaleBookings: cancelledBookings,
      archivedDuplicateEvents: archivedDuplicates,
      collectedArchivedImages: imageGc.collected,
      archivedStaleLinkEvents: staleSweep.archived,
      clearedStaleCtas: staleSweep.clearedCtas,
    },
    telegramWebhook,
    linkHealth,
    review,
    errors,
  };

  // Optional: ?digest=true sends an email digest to ADMIN_EMAIL. Used by the
  // GitHub Actions nightly workflow so CI doesn't need its own Resend creds.
  const url = new URL(request.url);
  if (url.searchParams.get("digest") === "true" && process.env.ADMIN_EMAIL) {
    try {
      await sendTransactionalEmail(
        process.env.ADMIN_EMAIL,
        "Ubudian — daily maintenance digest",
        dailyMaintenanceDigest(payload),
      );
    } catch (err) {
      payload.errors.push(`digest email: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json(payload);
}
