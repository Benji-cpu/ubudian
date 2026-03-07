/**
 * Telegram Bot Webhook Receiver
 *
 * Receives incoming messages from Telegram groups where the bot is added.
 * Extracts text/photo content, stores in raw_ingestion_messages, and triggers
 * the parsing pipeline.
 *
 * Webhook URL: POST /api/webhooks/telegram?secret={TELEGRAM_WEBHOOK_SECRET}
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processRawMessage } from "@/lib/ingestion/pipeline";
import { parseTelegramUpdate } from "@/lib/ingestion/adapters/telegram";
import type { TelegramUpdate } from "@/lib/ingestion/adapters/telegram";

// Import to register the adapter
import "@/lib/ingestion/adapters/telegram";

export async function POST(request: Request) {
  // Verify webhook secret — prefer X-Telegram-Bot-Api-Secret-Token header,
  // fall back to ?secret= query param for backwards compatibility
  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const secret = headerSecret || querySecret;

  if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const supabase = createAdminClient();

    // Parse the Telegram update into a raw message
    const rawMsg = await parseTelegramUpdate(update);
    if (!rawMsg) {
      // Not a processable message (e.g., service message, too short)
      return NextResponse.json({ ok: true });
    }

    // Look up the Telegram source in event_sources
    const { data: source } = await supabase
      .from("event_sources")
      .select("id, config, is_enabled")
      .eq("source_type", "telegram")
      .eq("is_enabled", true)
      .limit(1)
      .single();

    if (!source) {
      console.warn("[telegram-webhook] No enabled Telegram source configured");
      return NextResponse.json({ ok: true });
    }

    // Check for duplicate message (same external_id from same source)
    if (rawMsg.external_id) {
      const { data: existing } = await supabase
        .from("raw_ingestion_messages")
        .select("id")
        .eq("source_id", source.id)
        .eq("external_id", rawMsg.external_id)
        .limit(1);

      if (existing?.length) {
        return NextResponse.json({ ok: true, status: "duplicate" });
      }
    }

    // Store the raw message
    const { data: storedMsg, error: storeError } = await supabase
      .from("raw_ingestion_messages")
      .insert({
        source_id: source.id,
        external_id: rawMsg.external_id || null,
        content_text: rawMsg.content_text || null,
        image_urls: rawMsg.image_urls || null,
        sender_name: rawMsg.sender_name || null,
        sender_id: rawMsg.sender_id || null,
        raw_data: rawMsg.raw_data || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (storeError || !storedMsg) {
      console.error("[telegram-webhook] Failed to store message:", storeError);
      return NextResponse.json({ ok: true, error: "store_failed" });
    }

    // Process through the pipeline (non-blocking in production,
    // but we await here for correctness)
    const result = await processRawMessage(
      storedMsg.id,
      rawMsg,
      source.id,
      source.config || {}
    );

    console.log(`[telegram-webhook] Processed message ${storedMsg.id}: ${result.status}`);

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    console.error("[telegram-webhook] Error:", err);
    // Always return 200 to Telegram so it doesn't retry
    return NextResponse.json({ ok: true, error: "processing_failed" });
  }
}
