/**
 * Telegram Bot setup script.
 *
 * 1. Displays bot info (getMe)
 * 2. Clears any stale webhook (deleteWebhook)
 * 3. Discovers groups via getUpdates
 * 4. Creates a Telegram event_source in the database
 *
 * Usage:
 *   npx tsx scripts/telegram-setup.ts
 *
 * Requires: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set in .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

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
  // 1. Get bot info
  console.log("Fetching bot info...\n");
  const me = await tg("getMe");
  if (!me.ok) {
    console.error("Failed to call getMe:", me);
    process.exit(1);
  }
  console.log(`  Bot name:     ${me.result.first_name}`);
  console.log(`  Bot username:  @${me.result.username}`);
  console.log(`  Bot ID:        ${me.result.id}\n`);

  // 2. Delete any stale webhook
  console.log("Clearing any existing webhook...");
  const del = await tg("deleteWebhook");
  console.log(`  deleteWebhook: ${del.ok ? "OK" : del.description}\n`);

  // 3. Discover groups via getUpdates
  console.log("Fetching recent updates to discover groups...");
  const updates = await tg("getUpdates", { limit: 100 });
  if (!updates.ok) {
    console.error("Failed to call getUpdates:", updates);
    process.exit(1);
  }

  const chats = new Map<number, string>();
  for (const update of updates.result || []) {
    const msg = update.message || update.channel_post;
    if (msg?.chat && (msg.chat.type === "group" || msg.chat.type === "supergroup" || msg.chat.type === "channel")) {
      chats.set(msg.chat.id, msg.chat.title || `Chat ${msg.chat.id}`);
    }
  }

  if (chats.size === 0) {
    console.log("\n  No groups discovered from recent updates.");
    console.log("  This likely means one of:");
    console.log("    - The bot hasn't received any messages in groups yet");
    console.log("    - Group Privacy mode is ON (default) — only /commands are visible");
    console.log("");
    console.log("  To fix: Open @BotFather -> /mybots -> your bot -> Bot Settings -> Group Privacy -> Turn off");
    console.log("  Then send a message in the group and re-run this script.\n");
  } else {
    console.log(`\n  Discovered ${chats.size} group(s):\n`);
    for (const [id, title] of chats) {
      console.log(`    ${title} (ID: ${id})`);
    }
    console.log();
  }

  // 4. Create or update the event_source record
  const chatIds = Array.from(chats.entries()).map(([id, title]) => ({ id, title }));

  const sourceConfig = {
    bot_token_env: "TELEGRAM_BOT_TOKEN",
    chat_ids: chatIds,
  };

  // Check if source already exists
  const { data: existing } = await supabase
    .from("event_sources")
    .select("id")
    .eq("slug", "telegram")
    .single();

  if (existing) {
    const { error } = await supabase
      .from("event_sources")
      .update({
        config: sourceConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Failed to update event source:", error.message);
      process.exit(1);
    }
    console.log(`Updated existing Telegram event source (ID: ${existing.id})`);
  } else {
    const { data, error } = await supabase
      .from("event_sources")
      .insert({
        name: "Telegram Community Groups",
        slug: "telegram",
        source_type: "telegram",
        config: sourceConfig,
        is_enabled: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create event source:", error.message);
      console.error("Have you run the ingestion schema migration?");
      console.error("  npx tsx scripts/apply-ingestion-schema.ts");
      process.exit(1);
    }
    console.log(`Created Telegram event source (ID: ${data.id})`);
  }

  console.log("\nDone! Next steps:");
  console.log("  npm run telegram:poll   — start polling for messages locally");
}

main().catch(console.error);
