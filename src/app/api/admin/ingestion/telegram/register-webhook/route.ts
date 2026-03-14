/**
 * POST /api/admin/ingestion/telegram/register-webhook
 *
 * Registers the Telegram webhook by calling the Telegram Bot API setWebhook.
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not set" },
      { status: 400 }
    );
  }

  if (!siteUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is not set" },
      { status: 400 }
    );
  }

  const webhookUrl = `${siteUrl}/api/webhooks/telegram`;

  try {
    const body: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ["message", "channel_post"],
    };

    if (webhookSecret) {
      body.secret_token = webhookSecret;
    }

    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description || "Telegram API error" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      webhook_url: webhookUrl,
      description: data.description,
    });
  } catch (err) {
    console.error("[telegram-register] Error:", err);
    return NextResponse.json(
      { error: "Failed to call Telegram API" },
      { status: 500 }
    );
  }
}
