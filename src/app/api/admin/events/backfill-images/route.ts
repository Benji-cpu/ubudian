import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { enrichFromUrls } from "@/lib/ingestion/url-enricher";
import { persistRemoteImage } from "@/lib/ingestion/image-persistence";
import { getTelegramFileUrl } from "@/lib/ingestion/adapters/telegram";

export const maxDuration = 60;

const bodySchema = z.object({
  limit: z.number().int().min(1).max(200).default(25),
  dryRun: z.boolean().default(false),
  eventId: z.string().uuid().optional(),
});

type Detail = {
  id: string;
  title: string;
  status:
    | "updated"
    | "migrated_telegram"
    | "no_image_found"
    | "persist_failed"
    | "skipped"
    | "dry_run";
  candidates: string[];
  foundImage?: string;
  storedImage?: string;
};

const TELEGRAM_BOT_URL_PREFIX = "https://api.telegram.org/file/bot";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { success } = rateLimit(`backfill-images:${ip}`, { limit: 5, windowSeconds: 3600 });
  if (!success) {
    return NextResponse.json({ error: "Too many backfill runs. Try again later." }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json().catch(() => ({})));
  } catch (err) {
    return NextResponse.json({ error: "Invalid body", details: String(err) }, { status: 400 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("events")
    .select(
      "id, title, source_url, external_ticket_url, cover_image_url, status, raw_message_id"
    )
    .or(`cover_image_url.is.null,cover_image_url.like.${TELEGRAM_BOT_URL_PREFIX}%`)
    .in("status", ["pending", "approved"])
    .order("start_date", { ascending: false })
    .limit(body.limit);

  if (body.eventId) query = query.eq("id", body.eventId);

  const { data: events, error } = await query;
  if (error) {
    return NextResponse.json({ error: `Query failed: ${error.message}` }, { status: 500 });
  }

  const details: Detail[] = [];
  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (const ev of events ?? []) {
    const hasLeakingTelegramUrl =
      typeof ev.cover_image_url === "string" &&
      ev.cover_image_url.startsWith(TELEGRAM_BOT_URL_PREFIX);

    const candidates = [ev.source_url, ev.external_ticket_url].filter(
      (u): u is string => typeof u === "string" && u.length > 0
    );

    // For token-leak events, first try migrating the existing Telegram URL
    // itself (still valid if recent) — no external scrape needed.
    if (hasLeakingTelegramUrl) {
      if (body.dryRun) {
        details.push({
          id: ev.id,
          title: ev.title,
          status: "dry_run",
          candidates,
          foundImage: ev.cover_image_url as string,
        });
        await sleep(100);
        continue;
      }

      let telegramUrl: string = ev.cover_image_url as string;
      let migrated = await persistRemoteImage(telegramUrl, "events", ev.id);

      // Telegram file URLs expire after ~1 hour. If the direct fetch fails,
      // ask the Bot API for a fresh URL using the file_id stashed in the
      // original raw message. That requires TELEGRAM_BOT_TOKEN in env.
      if (!migrated && ev.raw_message_id) {
        const refreshedUrl = await refreshTelegramUrlFromRaw(
          supabase,
          ev.raw_message_id as string
        );
        if (refreshedUrl) {
          telegramUrl = refreshedUrl;
          migrated = await persistRemoteImage(telegramUrl, "events", ev.id);
        }
      }

      if (migrated) {
        const { error: updateError } = await supabase
          .from("events")
          .update({ cover_image_url: migrated })
          .eq("id", ev.id);
        if (!updateError) {
          enriched++;
          details.push({
            id: ev.id,
            title: ev.title,
            status: "migrated_telegram",
            candidates,
            storedImage: migrated,
          });
          await sleep(250);
          continue;
        }
      }
      // Telegram URL expired and file_id refresh failed — fall through to URL scraping.
    }

    if (candidates.length === 0) {
      skipped++;
      details.push({ id: ev.id, title: ev.title, status: "skipped", candidates: [] });
      continue;
    }

    const result = await enrichFromUrls(candidates, { cover_image_url: null });
    const foundImage = result.cover_image_url;

    if (!foundImage) {
      failed++;
      details.push({ id: ev.id, title: ev.title, status: "no_image_found", candidates });
      await sleep(250);
      continue;
    }

    if (body.dryRun) {
      details.push({ id: ev.id, title: ev.title, status: "dry_run", candidates, foundImage });
      await sleep(250);
      continue;
    }

    const stored = await persistRemoteImage(foundImage, "events", ev.id);
    if (!stored) {
      failed++;
      details.push({
        id: ev.id,
        title: ev.title,
        status: "persist_failed",
        candidates,
        foundImage,
      });
      await sleep(250);
      continue;
    }

    const { error: updateError } = await supabase
      .from("events")
      .update({ cover_image_url: stored })
      .eq("id", ev.id);

    if (updateError) {
      failed++;
      details.push({
        id: ev.id,
        title: ev.title,
        status: "persist_failed",
        candidates,
        foundImage,
        storedImage: stored,
      });
    } else {
      enriched++;
      details.push({
        id: ev.id,
        title: ev.title,
        status: "updated",
        candidates,
        foundImage,
        storedImage: stored,
      });
    }

    await sleep(250);
  }

  return NextResponse.json({
    scanned: events?.length ?? 0,
    enriched,
    failed,
    skipped,
    dryRun: body.dryRun,
    details,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type SupabaseClient = ReturnType<typeof createAdminClient>;

async function refreshTelegramUrlFromRaw(
  supabase: SupabaseClient,
  rawMessageId: string
): Promise<string | null> {
  const { data: raw } = await supabase
    .from("raw_ingestion_messages")
    .select("raw_data")
    .eq("id", rawMessageId)
    .single();

  const message =
    (raw?.raw_data as { message?: unknown; channel_post?: unknown } | null)
      ?.message ??
    (raw?.raw_data as { message?: unknown; channel_post?: unknown } | null)
      ?.channel_post;
  if (!message || typeof message !== "object") return null;

  const photos = (message as { photo?: Array<{ file_id: string; file_size?: number }> })
    .photo;
  const document = (
    message as { document?: { file_id: string; mime_type?: string } }
  ).document;

  let fileId: string | undefined;
  if (Array.isArray(photos) && photos.length > 0) {
    fileId = photos[photos.length - 1]?.file_id;
  } else if (document?.mime_type?.startsWith("image/") && document.file_id) {
    fileId = document.file_id;
  }

  if (!fileId) return null;
  return await getTelegramFileUrl(fileId);
}
