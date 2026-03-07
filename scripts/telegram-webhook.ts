/**
 * Telegram webhook management script for production.
 *
 * Commands:
 *   npx tsx scripts/telegram-webhook.ts status         — show current webhook info
 *   npx tsx scripts/telegram-webhook.ts set <URL>       — register webhook URL
 *   npx tsx scripts/telegram-webhook.ts delete          — clear webhook (back to polling)
 *
 * Usage:
 *   npm run telegram:webhook status
 *   npm run telegram:webhook set https://your-app.vercel.app
 *   npm run telegram:webhook delete
 *
 * Requires: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set in .env.local");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method: string, params?: Record<string, unknown>) {
  const url = new URL(`${API}/${method}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  return res.json();
}

async function status() {
  const info = await tg("getWebhookInfo");
  if (!info.ok) {
    console.error("Failed to get webhook info:", info);
    process.exit(1);
  }

  const w = info.result;
  console.log("Webhook status:\n");
  console.log(`  URL:                ${w.url || "(not set — polling mode)"}`);
  console.log(`  Has custom cert:    ${w.has_custom_certificate}`);
  console.log(`  Pending updates:    ${w.pending_update_count}`);
  if (w.last_error_date) {
    const date = new Date(w.last_error_date * 1000);
    console.log(`  Last error:         ${w.last_error_message} (${date.toISOString()})`);
  }
  if (w.ip_address) {
    console.log(`  IP address:         ${w.ip_address}`);
  }
  if (w.allowed_updates?.length) {
    console.log(`  Allowed updates:    ${w.allowed_updates.join(", ")}`);
  }
}

async function set(baseUrl: string) {
  if (!WEBHOOK_SECRET) {
    console.error("Error: TELEGRAM_WEBHOOK_SECRET is not set in .env.local");
    console.error("Generate one with: openssl rand -hex 32");
    process.exit(1);
  }

  // Build the full webhook URL with query param fallback
  const webhookUrl = `${baseUrl}/api/webhooks/telegram?secret=${WEBHOOK_SECRET}`;

  console.log(`Setting webhook to: ${baseUrl}/api/webhooks/telegram\n`);

  const result = await tg("setWebhook", {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: JSON.stringify(["message", "channel_post"]),
  });

  if (result.ok) {
    console.log("Webhook set successfully!");
    console.log(`  URL: ${webhookUrl}`);
    console.log(`  Secret token: configured (sent via X-Telegram-Bot-Api-Secret-Token header)`);
  } else {
    console.error("Failed to set webhook:", result.description);
    process.exit(1);
  }
}

async function del() {
  const result = await tg("deleteWebhook");
  if (result.ok) {
    console.log("Webhook deleted. Bot is now in polling mode.");
  } else {
    console.error("Failed to delete webhook:", result.description);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "status":
      await status();
      break;
    case "set": {
      const url = process.argv[3];
      if (!url) {
        console.error("Usage: npx tsx scripts/telegram-webhook.ts set <VERCEL_URL>");
        console.error("Example: npx tsx scripts/telegram-webhook.ts set https://ubudian.com");
        process.exit(1);
      }
      await set(url.replace(/\/+$/, ""));
      break;
    }
    case "delete":
      await del();
      break;
    default:
      console.log("Telegram Webhook Manager\n");
      console.log("Commands:");
      console.log("  status              Show current webhook info");
      console.log("  set <URL>           Register webhook URL for production");
      console.log("  delete              Clear webhook (switch to polling mode)");
      console.log("\nExamples:");
      console.log("  npx tsx scripts/telegram-webhook.ts status");
      console.log("  npx tsx scripts/telegram-webhook.ts set https://ubudian.com");
      console.log("  npx tsx scripts/telegram-webhook.ts delete");
  }
}

main().catch(console.error);
