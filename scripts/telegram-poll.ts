/**
 * Local Telegram polling script for development.
 *
 * Uses Telegram's getUpdates long-polling API to receive messages
 * without needing a public webhook URL. Mirrors the exact same flow
 * as the webhook handler at src/app/api/webhooks/telegram/route.ts.
 *
 * Usage:
 *   npx tsx scripts/telegram-poll.ts
 *
 * Requires: TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { parseTelegramUpdate } from "../src/lib/ingestion/adapters/telegram";
import { processRawMessage } from "../src/lib/ingestion/pipeline";
import type { TelegramUpdate } from "../src/lib/ingestion/adapters/telegram";

// Register the adapter
import "../src/lib/ingestion/adapters/telegram";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.warn("[telegram-poll] TELEGRAM_BOT_TOKEN not set — polling disabled");
  process.exit(0);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let running = true;
let offset = 0;

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  running = false;
});

process.on("SIGTERM", () => {
  console.log("\nShutting down...");
  running = false;
});

async function tg(method: string, params?: Record<string, unknown>) {
  const url = new URL(`${API}/${method}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  return res.json();
}

async function main() {
  // Delete any existing webhook (required for getUpdates to work)
  console.log("Clearing webhook for polling mode...");
  await tg("deleteWebhook");

  // Load the Telegram event source
  const { data: source, error: sourceError } = await supabase
    .from("event_sources")
    .select("id, config, is_enabled")
    .eq("slug", "telegram")
    .eq("is_enabled", true)
    .single();

  if (sourceError || !source) {
    console.warn("[telegram-poll] No enabled Telegram event source found. Run: npm run telegram:setup");
    console.warn("[telegram-poll] Polling disabled.");
    process.exit(0);
  }

  console.log(`\nTelegram source loaded (ID: ${source.id})`);
  console.log("Waiting for messages... (Ctrl+C to stop)\n");

  while (running) {
    try {
      const data = await tg("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: JSON.stringify(["message", "channel_post"]),
      });

      if (!data.ok) {
        console.error("getUpdates error:", data.description);
        await sleep(5000);
        continue;
      }

      const updates: TelegramUpdate[] = data.result || [];

      for (const update of updates) {
        // Advance offset past this update
        offset = update.update_id + 1;

        const msg = update.message || update.channel_post;
        if (!msg) continue;

        const chatName = msg.chat.title || `Chat ${msg.chat.id}`;
        const senderName = msg.from
          ? [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ")
          : "Unknown";
        const textPreview = (msg.text || msg.caption || "").slice(0, 80);

        console.log(
          `[${new Date().toLocaleTimeString()}] ${chatName} | ${senderName}: ${textPreview}${textPreview.length >= 80 ? "..." : ""}`
        );

        // Parse the update
        const rawMsg = await parseTelegramUpdate(update);
        if (!rawMsg) {
          console.log("  -> Skipped (too short or not processable)\n");
          continue;
        }

        // Check for duplicate external_id
        if (rawMsg.external_id) {
          const { data: existing } = await supabase
            .from("raw_ingestion_messages")
            .select("id")
            .eq("source_id", source.id)
            .eq("external_id", rawMsg.external_id)
            .limit(1);

          if (existing?.length) {
            console.log("  -> Skipped (duplicate message)\n");
            continue;
          }
        }

        // Store raw message
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
          console.error("  -> Failed to store message:", storeError?.message);
          continue;
        }

        // Process through the pipeline
        try {
          const result = await processRawMessage(
            storedMsg.id,
            rawMsg,
            source.id,
            source.config || {}
          );

          switch (result.status) {
            case "created":
              console.log(`  -> Event created (ID: ${result.eventId})`);
              break;
            case "duplicate":
              console.log("  -> Duplicate event detected");
              break;
            case "not_event":
              console.log("  -> Not an event");
              break;
            case "failed":
              console.log(`  -> Failed: ${result.error}`);
              break;
          }
        } catch (err) {
          console.error(
            "  -> Pipeline error:",
            err instanceof Error ? err.message : err
          );
        }

        console.log();
      }
    } catch (err) {
      if (!running) break;
      console.error(
        "Polling error:",
        err instanceof Error ? err.message : err
      );
      await sleep(5000);
    }
  }

  console.log("Polling stopped.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
