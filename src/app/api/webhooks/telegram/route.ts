/**
 * Telegram Bot Webhook Receiver
 *
 * Receives incoming messages from Telegram groups where the bot is added.
 * Extracts text/photo content, stores in raw_ingestion_messages, and triggers
 * the parsing pipeline.
 *
 * Webhook URL: POST /api/webhooks/telegram
 *
 * Images: Downloaded from Telegram API and re-uploaded to Supabase Storage
 * (Telegram file URLs are ephemeral and expire after ~1 hour).
 *
 * LLM processing is deferred via after() to avoid blocking the webhook response.
 */

import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processRawMessage } from "@/lib/ingestion/pipeline";
import {
  parseTelegramUpdate,
  downloadTelegramMedia,
} from "@/lib/ingestion/adapters/telegram";
import type { TelegramUpdate } from "@/lib/ingestion/adapters/telegram";

// Import to register the adapter
import "@/lib/ingestion/adapters/telegram";

export async function POST(request: Request) {
  // Verify webhook secret via X-Telegram-Bot-Api-Secret-Token header
  const secret = request.headers.get("x-telegram-bot-api-secret-token");

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

    // Group filtering — matches WhatsApp pattern
    const config = (source.config || {}) as Record<string, unknown>;
    const allowedGroups = config.allowed_groups as string[] | undefined;
    const chatId = String(
      update.message?.chat?.id || update.channel_post?.chat?.id || ""
    );

    if (allowedGroups?.length && chatId && !allowedGroups.includes(chatId)) {
      return NextResponse.json({ ok: true }); // Silently ignore non-allowed groups
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

    // Persist Telegram images to Supabase Storage
    // (Telegram file URLs expire after ~1 hour and leak the bot token)
    if (rawMsg.image_urls?.length) {
      const permanentUrls: string[] = [];

      for (let i = 0; i < rawMsg.image_urls.length; i++) {
        const telegramUrl = rawMsg.image_urls[i];
        const media = await downloadTelegramMedia(telegramUrl);
        if (media) {
          const ext = media.contentType.includes("png") ? "png" : "jpg";
          const filename = `ingestion/${Date.now()}-tg-${rawMsg.external_id}-${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(filename, media.buffer, {
              contentType: media.contentType,
              upsert: false,
            });

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("images").getPublicUrl(filename);
            permanentUrls.push(publicUrl);
          } else {
            console.error("[telegram-webhook] Storage upload error:", uploadError);
          }
        }
      }

      rawMsg.image_urls = permanentUrls.length > 0 ? permanentUrls : undefined;
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
        chat_name: rawMsg.chat_name || null,
        raw_data: rawMsg.raw_data || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (storeError || !storedMsg) {
      console.error("[telegram-webhook] Failed to store message:", storeError);
      return NextResponse.json({ ok: true, error: "store_failed" });
    }

    // Defer LLM processing so the webhook responds immediately
    after(async () => {
      try {
        const result = await processRawMessage(
          storedMsg.id,
          rawMsg,
          source.id,
          source.config || {}
        );
        console.log(`[telegram-webhook] Processed message ${storedMsg.id}: ${result.status}`);
      } catch (err) {
        console.error(`[telegram-webhook] Background processing failed for ${storedMsg.id}:`, err);
        await createAdminClient()
          .from("raw_ingestion_messages")
          .update({
            status: "failed",
            parse_error: err instanceof Error ? err.message : "Background processing failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", storedMsg.id);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook] Error:", err);
    // Always return 200 to Telegram so it doesn't retry
    return NextResponse.json({ ok: true, error: "processing_failed" });
  }
}
