/**
 * GET /api/admin/ingestion/telegram/webhook-status
 *
 * Calls Telegram's getWebhookInfo API and returns diagnostic info:
 * - Current registered URL vs expected URL
 * - Pending update count
 * - Last error details
 *
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not set" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description || "Telegram API error" },
        { status: 502 }
      );
    }

    const info = data.result;
    const expectedUrl = siteUrl
      ? `${siteUrl}/api/webhooks/telegram`
      : null;

    return NextResponse.json({
      registered_url: info.url || null,
      expected_url: expectedUrl,
      url_matches: expectedUrl ? info.url === expectedUrl : null,
      has_custom_certificate: info.has_custom_certificate || false,
      pending_update_count: info.pending_update_count || 0,
      last_error_date: info.last_error_date
        ? new Date(info.last_error_date * 1000).toISOString()
        : null,
      last_error_message: info.last_error_message || null,
      max_connections: info.max_connections || null,
      allowed_updates: info.allowed_updates || [],
    });
  } catch (err) {
    console.error("[telegram-webhook-status] Error:", err);
    return NextResponse.json(
      { error: "Failed to call Telegram API" },
      { status: 500 }
    );
  }
}
