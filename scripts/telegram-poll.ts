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

// Prefer a dedicated dev bot. Local polling is destructive to whatever bot it
// runs against (it deletes that bot's webhook to use getUpdates), so by default
// we never run it against the production bot — set TELEGRAM_DEV_BOT_TOKEN to a
// second BotFather bot added to the same groups and poll that instead.
const DEV_BOT_TOKEN = process.env.TELEGRAM_DEV_BOT_TOKEN;
const BOT_TOKEN = DEV_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const usingProdBot = !DEV_BOT_TOKEN;
// Escape hatch: poll the production bot anyway (restores its webhook on a
// graceful exit). A hard kill still leaves prod without a webhook until the
// nightly self-heal re-asserts it — so this is opt-in, not the default.
const FORCE_PROD_POLL = process.env.TELEGRAM_POLL_FORCE === "1";

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

// Graceful shutdown — signal handlers just flip the flag;
// main() restores the production webhook after the loop exits.
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

async function tgPost(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  // Check for an existing production webhook before clearing it.
  const webhookInfo = await tg("getWebhookInfo");
  const existingWebhookUrl: string | null = webhookInfo?.result?.url || null;
  const isProductionWebhook =
    !!existingWebhookUrl && !existingWebhookUrl.includes("localhost");

  // Guard: never silently break production. If we'd be polling the prod bot and
  // it has a live webhook, bail unless explicitly forced — deleting it here and
  // relying on a graceful exit to restore it is exactly how prod has gone dark.
  if (usingProdBot && isProductionWebhook && !FORCE_PROD_POLL) {
    console.warn("\n[telegram-poll] Production webhook is live on the production bot:");
    console.warn(`[telegram-poll]   ${existingWebhookUrl}`);
    console.warn("[telegram-poll] Skipping local polling so it isn't torn down.\n");
    console.warn("[telegram-poll] To test ingestion locally, either:");
    console.warn("[telegram-poll]   • set TELEGRAM_DEV_BOT_TOKEN to a second bot in the same groups (recommended), or");
    console.warn("[telegram-poll]   • set TELEGRAM_POLL_FORCE=1 to poll the prod bot (restores the webhook on a clean exit).\n");
    process.exit(0);
  }

  // Only the prod bot's webhook is worth restoring; a dev bot has none.
  const shouldRestoreWebhook = usingProdBot && isProductionWebhook;
  if (DEV_BOT_TOKEN) {
    console.log("[telegram-poll] Using TELEGRAM_DEV_BOT_TOKEN — production bot untouched.\n");
  } else if (shouldRestoreWebhook) {
    console.log(`[telegram-poll] Production webhook detected: ${existingWebhookUrl}`);
    console.log("[telegram-poll] FORCE mode: it will be restored when polling stops.\n");
  }

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

  // Restore production webhook so Vercel keeps receiving messages
  if (shouldRestoreWebhook) {
    console.log(`\n[telegram-poll] Restoring production webhook: ${existingWebhookUrl}`);
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Restoring without secret_token re-registers a webhook that 401s every
      // update (the route validates the X-Telegram-Bot-Api-Secret-Token header).
      // This is the exact failure that took prod down — refuse to do it silently.
      console.error(
        "[telegram-poll] TELEGRAM_WEBHOOK_SECRET is missing — restoring without it would 401 every update."
      );
      console.error(
        "[telegram-poll] Set TELEGRAM_WEBHOOK_SECRET in .env.local, then run 'Register Webhook' in the admin panel."
      );
      return;
    }
    const body: Record<string, unknown> = {
      url: existingWebhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["message", "channel_post"],
    };
    const result = await tgPost("setWebhook", body);
    if (result.ok) {
      console.log("[telegram-poll] Production webhook restored.");
    } else {
      console.error(
        "[telegram-poll] Failed to restore webhook:",
        result.description,
        `\nRun 'Register Webhook' in the admin panel to restore manually.`
      );
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
