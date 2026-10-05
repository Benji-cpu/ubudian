/**
 * POST /api/cron/events-bus/ingest
 *
 * The events-desk routine's events, posted by the private bus repo's apply
 * Action (`Benji-cpu/ubudian-events-bus`, key from `src/lib/events-bus/auth.ts`).
 * The routine read Instagram posts and venue pages, parsed each event and gave
 * it a verdict. This route:
 *   1. validates shape (`schema.ts`) and ranges/hosts (`guards.ts`), and scrubs
 *      URLs and phone numbers from the copy;
 *   2. ingests through the same path as every harvester (`ingestPreParsed`:
 *      dedup, geocode, pending);
 *   3. stores the verdict: approve → `moderation_reason = routine_ok` (the gate
 *      then spends no Gemini call), reject → `status = rejected`, so the nightly
 *      gate never re-moderates it;
 *   4. copies the cover into our storage (Instagram CDN links expire in days);
 *   5. runs the editorial gate on just these rows, so they publish now with the
 *      same structural screen and duplicate checks as everything else.
 * An empty `items` array is a heartbeat: it stamps the source's last_success_at,
 * which daily-maintenance watches.
 *
 * Body: { date, source: "instagram" | "web-pages", items: BusItem[] } (≤12 items).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEventsBusAuthorised } from "@/lib/events-bus/auth";
import { busIngestSchema } from "@/lib/events-bus/schema";
import { itemProblems, scrubCopy } from "@/lib/events-bus/guards";
import { ingestPreParsed } from "@/lib/ingestion/preparsed-ingest";
import { persistRemoteImage } from "@/lib/ingestion/image-persistence";
import { autoApprovePending, ROUTINE_VERDICT_OK } from "@/lib/maintenance/auto-approve";
import { nowInBali } from "@/lib/events/bali-time";
import type { ParsedEvent } from "@/lib/ingestion/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = busIngestSchema.extend({ source: z.enum(["instagram", "web-pages"]) });

type Outcome = {
  ref: string;
  status: "invalid" | "created" | "duplicate" | "failed";
  eventId?: string;
  verdict?: "approved" | "held" | "rejected" | "duplicate";
  reason?: string;
};

export async function POST(request: Request) {
  if (!isEventsBusAuthorised(request.headers.get("authorization"))) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : "Invalid JSON";
    return NextResponse.json({ data: null, error: msg }, { status: 400 });
  }

  const today = nowInBali().dateStr;
  const outcomes: Outcome[] = [];
  const accepted: { ref: string; ok: boolean; reason: string; parsed: ParsedEvent }[] = [];

  for (const item of body.items) {
    const problems = itemProblems(item, today);
    if (problems.length) {
      outcomes.push({ ref: item.ref, status: "invalid", reason: problems.join("; ") });
      continue;
    }
    const e = item.event;
    // One weekly line-up post can announce six events, and the pipeline treats an
    // exact source_url match as the same event. A fragment keeps each its own URL
    // (the link still opens the post) while re-sending the same event stays a duplicate.
    const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const sourceUrl = `${e.source_url.replace(/#.*$/, "")}#${e.start_date}-${slug}`;
    const parsed: ParsedEvent = {
      ...e,
      source_url: sourceUrl,
      description: scrubCopy(e.description),
      short_description: scrubCopy(e.short_description),
      end_date: e.end_date ?? e.start_date,
      is_recurring: false,
      organizer_instagram: e.organizer_instagram ?? null,
      // Ingest copies the cover below, after it has an id to name the file by.
      cover_image_url: e.cover_image_url ?? null,
      source_event_id: `${sourceUrl}T${e.start_time ?? ""}`,
    };
    accepted.push({ ref: item.ref, ok: item.verdict.ok, reason: item.verdict.reason, parsed });
  }

  let result;
  try {
    result = await ingestPreParsed(body.source, body.date, accepted.map((a) => a.parsed));
  } catch (err) {
    return NextResponse.json({ data: null, error: err instanceof Error ? err.message : "ingest failed" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const approveIds: string[] = [];
  const byId = new Map<string, Outcome>();

  for (let i = 0; i < accepted.length; i++) {
    const a = accepted[i];
    const r = result.items[i];
    if (r.status === "duplicate") {
      outcomes.push({ ref: a.ref, status: "duplicate" });
      continue;
    }
    if (r.status === "failed") {
      outcomes.push({ ref: a.ref, status: "failed", reason: r.error });
      continue;
    }
    const outcome: Outcome = { ref: a.ref, status: "created", eventId: r.eventId };
    outcomes.push(outcome);
    byId.set(r.eventId, outcome);

    // Instagram CDN links are signed and expire, so an unstored IG cover is
    // dropped; a venue page's own image URL is kept if the copy fails.
    let cover: string | null = null;
    if (a.parsed.cover_image_url) {
      cover = await persistRemoteImage(a.parsed.cover_image_url, "events", r.eventId);
      if (!cover && body.source === "web-pages") cover = a.parsed.cover_image_url;
    }

    if (a.ok) {
      await supabase
        .from("events")
        .update({ moderation_reason: ROUTINE_VERDICT_OK, cover_image_url: cover })
        .eq("id", r.eventId)
        .eq("status", "pending");
      approveIds.push(r.eventId);
    } else {
      // Rejected now, not left pending: the nightly gate would re-moderate it.
      await supabase
        .from("events")
        .update({ status: "rejected", moderation_reason: "routine_reject", rejection_reason: a.reason, cover_image_url: cover })
        .eq("id", r.eventId)
        .eq("status", "pending");
      outcome.verdict = "rejected";
      outcome.reason = a.reason;
    }
  }

  if (approveIds.length) {
    const gate = await autoApprovePending({ onlyIds: approveIds, maxElapsedMs: 15_000 });
    for (const d of gate.decisions) {
      const o = byId.get(d.id);
      if (!o) continue;
      o.verdict = d.verdict === "rejected" ? "rejected" : d.verdict;
      o.reason = d.reason;
    }
    for (const id of approveIds) {
      const o = byId.get(id);
      if (o && !o.verdict) {
        o.verdict = "held";
        o.reason = "not reached by the gate this run";
      }
    }
  }

  return NextResponse.json({
    data: {
      date: body.date,
      source: body.source,
      ingested: result.ingested,
      duplicates: result.duplicates,
      failed: result.failed,
      outcomes,
    },
    error: null,
  });
}
