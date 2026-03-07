/**
 * WAHA (WhatsApp HTTP API) Webhook
 *
 * POST — Incoming message processing from WAHA server
 *
 * WAHA pushes messages to this endpoint. No GET verification needed
 * (unlike Meta's challenge-response flow).
 *
 * Media handling: WAHA media URLs require auth headers, so we download
 * images here and upload them to Supabase Storage, passing the public
 * URL through the pipeline.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processRawMessage } from "@/lib/ingestion/pipeline";
import {
  parseWahaWebhook,
  downloadWahaMedia,
  verifyWahaWebhookSecret,
} from "@/lib/ingestion/adapters/whatsapp";
import type { WahaWebhookPayload } from "@/lib/ingestion/adapters/whatsapp";

// Import to register adapter
import "@/lib/ingestion/adapters/whatsapp";

/**
 * Incoming WAHA message handler.
 */
export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get("x-webhook-secret");
    if (!verifyWahaWebhookSecret(webhookSecret)) {
      console.warn("[waha-webhook] Invalid or missing webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: WahaWebhookPayload = await request.json();

    // Parse and filter the message
    const rawMsg = parseWahaWebhook(body);
    if (!rawMsg) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();

    // Look up WhatsApp source
    const { data: source } = await supabase
      .from("event_sources")
      .select("id, config, is_enabled")
      .eq("source_type", "whatsapp")
      .eq("is_enabled", true)
      .limit(1)
      .single();

    if (!source) {
      return NextResponse.json({ ok: true });
    }

    // Optional: filter by allowed groups
    const config = (source.config || {}) as Record<string, unknown>;
    const allowedGroups = config.allowed_groups as string[] | undefined;
    if (allowedGroups?.length && !allowedGroups.includes(body.payload.from)) {
      return NextResponse.json({ ok: true });
    }

    // Check for duplicate
    if (rawMsg.external_id) {
      const { data: existing } = await supabase
        .from("raw_ingestion_messages")
        .select("id")
        .eq("source_id", source.id)
        .eq("external_id", rawMsg.external_id)
        .limit(1);

      if (existing?.length) {
        return NextResponse.json({ ok: true });
      }
    }

    // Handle media: download from WAHA → upload to Supabase Storage
    if (body.payload.hasMedia && body.payload.mediaUrl) {
      const mediaType = body.payload.type;
      if (mediaType === "image" || !mediaType) {
        const media = await downloadWahaMedia(body.payload.mediaUrl);
        if (media) {
          const ext = media.contentType.includes("png") ? "png" : "jpg";
          const filename = `ingestion/${Date.now()}-${body.payload.id}.${ext}`;

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

            rawMsg.image_urls = [publicUrl];
          } else {
            console.error("[waha-webhook] Storage upload error:", uploadError);
          }
        }
      }
    }

    // Store raw message
    const { data: storedMsg } = await supabase
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

    if (storedMsg) {
      await processRawMessage(storedMsg.id, rawMsg, source.id, config);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waha-webhook] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
