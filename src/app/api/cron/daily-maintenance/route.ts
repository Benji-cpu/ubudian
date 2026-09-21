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
import { autoApprovePending, type AutoApproveResult } from "@/lib/maintenance/auto-approve";
import { autoResolveDedupMatches, type DedupAutoResolveResult } from "@/lib/maintenance/dedup-autoresolve";
import {
  archiveEndedRecurringEvents,
  expireStalePendingEvents,
  normalizeLegacyRecurrence,
  purgeStalePendingMessages,
  type ExpiryResult,
} from "@/lib/maintenance/expiry";
import { checkLiveness, type Liveness } from "@/lib/maintenance/liveness";
import { nowInBali } from "@/lib/events/bali-time";

// The gate makes up to AUTO_APPROVE_MAX_PER_RUN Gemini calls on top of the
// link-health sweep, so this route needs more than the platform default.
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  // ?dryRun=true screens the pending backlog and reports what it *would*
  // publish without writing anything. Use it to sanity-check the gate's taste
  // before trusting it, and after any change to the screening rules.
  const dryRun = url.searchParams.get("dryRun") === "true";

  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  // Data first: one recurrence format before anything reads a rule tonight.
  const legacyRecurrence = dryRun
    ? null
    : await normalizeLegacyRecurrence().catch((err) => {
        errors.push(`normalizeLegacyRecurrence: ${err?.message ?? String(err)}`);
        return null;
      });
  if (legacyRecurrence?.errors.length) errors.push(...legacyRecurrence.errors);

  // The dedup backlog resolves by rule BEFORE the gate reads it, otherwise the
  // gate (which fails closed on an unresolved match) holds the same rows for
  // another night. Skipped on a dry run: it writes.
  const dedupAutoResolve: DedupAutoResolveResult | null = dryRun
    ? null
    : await autoResolveDedupMatches().catch((err) => {
        errors.push(`autoResolveDedupMatches: ${err?.message ?? String(err)}`);
        return null;
      });
  if (dedupAutoResolve?.errors.length) errors.push(...dedupAutoResolve.errors.map((e) => `dedup: ${e}`));

  // Runs before archivePastPendingEvents so an event that is publishable today
  // gets its chance ahead of the sweep that would archive it tomorrow.
  const autoApprove: AutoApproveResult = await autoApprovePending({ dryRun }).catch((err) => {
    errors.push(`autoApprovePending: ${err?.message ?? String(err)}`);
    return {
      dryRun,
      scanned: 0,
      approved: 0,
      rejected: 0,
      held: 0,
      decisions: [],
      heldForCap: [],
      heldReasons: {},
      moderationFailedOpen: 0,
      errors: [],
    };
  });
  if (autoApprove.errors.length) errors.push(...autoApprove.errors.map((e) => `autoApprove: ${e}`));

  // A dry run must not mutate anything, so it stops here rather than falling
  // through to the archive/purge/GC sweeps below — those have no dry mode.
  if (dryRun) {
    return NextResponse.json({
      startedAt,
      finishedAt: new Date().toISOString(),
      dryRun: true,
      autoApprove,
      errors,
    });
  }

  // Anything the gate has declined for 30 nights is retired, except rows it
  // only held tonight because the per-run cap was full.
  const expiry: ExpiryResult = await expireStalePendingEvents({
    exclude: new Set(autoApprove.heldForCap),
  }).catch((err) => {
    errors.push(`expireStalePendingEvents: ${err?.message ?? String(err)}`);
    return { expired: 0, errors: [] };
  });
  if (expiry.errors.length) errors.push(...expiry.errors);

  const endedSeries: ExpiryResult = await archiveEndedRecurringEvents(nowInBali().dateStr).catch((err) => {
    errors.push(`archiveEndedRecurringEvents: ${err?.message ?? String(err)}`);
    return { expired: 0, errors: [] };
  });
  if (endedSeries.errors.length) errors.push(...endedSeries.errors);

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
  const purgedStale: ExpiryResult = await purgeStalePendingMessages().catch((err) => {
    errors.push(`purgeStalePendingMessages: ${err?.message ?? String(err)}`);
    return { expired: 0, errors: [] };
  });
  if (purgedStale.errors.length) errors.push(...purgedStale.errors);
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

  const liveness: Liveness = await checkLiveness().catch((err) => {
    errors.push(`checkLiveness: ${err?.message ?? String(err)}`);
    return {
      lastPublishedAt: null,
      hoursSincePublish: null,
      createdLast24h: 0,
      stale: true,
      line: "STALE: liveness check itself failed — treat as down.",
    };
  });

  const payload = {
    startedAt,
    finishedAt: new Date().toISOString(),
    liveness,
    autoApprove,
    dedupAutoResolve,
    autonomous: {
      autoApprovedEvents: autoApprove.approved,
      autoRejectedEvents: autoApprove.rejected,
      publishedUnmoderated: autoApprove.moderationFailedOpen,
      heldPendingEvents: autoApprove.held,
      expiredPendingEvents: expiry.expired,
      archivedEndedSeries: endedSeries.expired,
      normalizedLegacyRecurrence: legacyRecurrence?.normalized ?? 0,
      demotedRecurringWithoutRule: legacyRecurrence?.demoted ?? 0,
      purgedStalePendingMessages: purgedStale.expired,
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

  // This used to email the digest to ADMIN_EMAIL on ?digest=true — 32 mails in the
  // last month, every one of them a copy of the JSON below. The workflow that calls
  // this route already commits that JSON to digests/ and raises a CRM handover when
  // a check genuinely fails, so the mail was a third copy of a report nobody opened.
  // Removed 2026-09-21. The payload is unchanged; read it in the repo or the CRM.

  return NextResponse.json(payload);
}
