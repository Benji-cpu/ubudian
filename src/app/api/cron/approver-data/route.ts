/**
 * GET /api/cron/approver-data
 *
 * First leg of the git-as-bus pattern for the daily event approver.
 *
 * GH Actions workflow `.github/workflows/approver-fetch.yml` runs ~10 min
 * before the Claude trigger fires, curls this route with `CRON_SECRET`,
 * and commits the response to `curator/approvals/inbox/YYYY-MM-DD.json`.
 * The Claude trigger then reads that file (it cannot reach Supabase from
 * its sandbox) and decides each pending event.
 *
 * Response shape:
 *   {
 *     date: "YYYY-MM-DD",
 *     events: Array<{
 *       id, title, slug, description, short_description, category,
 *       venue_name, venue_address,
 *       start_date, end_date, start_time, end_time,
 *       is_recurring, recurrence_rule,
 *       price_info, external_ticket_url,
 *       organizer_name, organizer_instagram,
 *       cover_image_url, content_flags, quality_score,
 *       source_id, source_url, source_kind, ingested_at,
 *       raw_text_snippet,
 *       sibling_approved: Array<{id, title, venue_name, recurrence_rule, start_date}>
 *     }>
 *   }
 *
 * `sibling_approved` is a best-effort lookup of approved rows with the same
 * normalised title — the agent needs this to decide archive-as-dup without
 * a second round-trip.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

function baliDateStr(): string {
  // YYYY-MM-DD in Asia/Makassar.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normaliseTitle(t: string | null | undefined): string {
  return (t ?? "").toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  type PendingRow = {
    id: string;
    title: string | null;
    [key: string]: unknown;
  };

  const { data: pending, error: pendingError } = await supabase
    .from("events")
    .select(
      "id, title, slug, description, short_description, category, " +
        "venue_name, venue_address, start_date, end_date, start_time, end_time, " +
        "is_recurring, recurrence_rule, price_info, external_ticket_url, " +
        "organizer_name, organizer_instagram, cover_image_url, content_flags, " +
        "quality_score, source_id, source_url, source_kind, ingested_at, " +
        "raw_text_snippet"
    )
    .eq("status", "pending")
    .not("source_id", "is", null)
    .order("ingested_at", { ascending: false, nullsFirst: false })
    .limit(200)
    .returns<PendingRow[]>();

  if (pendingError) {
    return NextResponse.json(
      { error: `Failed to fetch pending events: ${pendingError.message}` },
      { status: 500 }
    );
  }

  const rows = pending ?? [];

  // Pre-fetch every approved row once and index by normalised title.
  // Punctuation (em-dashes etc.) breaks Postgres ilike prefix matching,
  // so we normalise both sides client-side. The approved set is bounded
  // (typically < 500 active rows) so this is cheap.
  type ApprovedRow = {
    id: string;
    title: string | null;
    venue_name: string | null;
    recurrence_rule: string | null;
    start_date: string | null;
  };

  const { data: approved } = await supabase
    .from("events")
    .select("id, title, venue_name, recurrence_rule, start_date")
    .eq("status", "approved")
    .limit(1000)
    .returns<ApprovedRow[]>();

  const approvedByNormTitle = new Map<string, ApprovedRow[]>();
  for (const sib of approved ?? []) {
    const key = normaliseTitle(sib.title);
    if (!key) continue;
    const bucket = approvedByNormTitle.get(key);
    if (bucket) bucket.push(sib);
    else approvedByNormTitle.set(key, [sib]);
  }

  const enriched = rows.map((row) => {
    const normTitle = normaliseTitle(row.title);
    const siblings = normTitle ? approvedByNormTitle.get(normTitle) ?? [] : [];
    return { ...row, sibling_approved: siblings };
  });

  return NextResponse.json({
    date: baliDateStr(),
    queue_size: enriched.length,
    events: enriched,
  });
}
