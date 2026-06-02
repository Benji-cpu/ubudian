/**
 * Telegram webhook self-heal, run by the daily-maintenance cron.
 *
 * The bot's webhook can silently drift into a broken state:
 *   - a hard-killed `npm run dev` (telegram-poll deletes the prod webhook on
 *     startup and only restores it on a *graceful* exit) leaves it deleted;
 *   - a webhook registered with the secret as a query param but no
 *     `secret_token` 401s every update (the route checks the header first).
 *
 * This helper compares the live webhook against the expected URL and re-asserts
 * it with `secret_token` whenever it's missing, pointed elsewhere, or Telegram
 * has logged a delivery error. Idempotent: a healthy webhook is a no-op.
 *
 * Runs server-side on Vercel, which has unrestricted egress to api.telegram.org.
 */

export type TelegramWebhookHealth = {
  checked: boolean;
  /** 'none' = healthy, 'repaired' = re-registered, 'error'/'skipped' otherwise */
  action: "none" | "repaired" | "error" | "skipped";
  reason?: string;
  registeredUrl?: string | null;
  expectedUrl?: string | null;
  pendingUpdateCount?: number;
  lastError?: string | null;
};

export async function ensureTelegramWebhook(): Promise<TelegramWebhookHealth> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!token) {
    return { checked: false, action: "skipped", reason: "TELEGRAM_BOT_TOKEN not set" };
  }
  if (!siteUrl) {
    return { checked: false, action: "skipped", reason: "NEXT_PUBLIC_SITE_URL not set" };
  }

  const expectedUrl = `${siteUrl.replace(/\/+$/, "")}/api/webhooks/telegram`;
  const api = `https://api.telegram.org/bot${token}`;

  try {
    const infoRes = await fetch(`${api}/getWebhookInfo`);
    const info = await infoRes.json();

    if (!info.ok) {
      return {
        checked: true,
        action: "error",
        reason: info.description || "getWebhookInfo failed",
        expectedUrl,
      };
    }

    const w = info.result || {};
    const registeredUrl: string | null = w.url || null;
    const lastError: string | null = w.last_error_message || null;
    const pendingUpdateCount: number = w.pending_update_count || 0;

    // Strip any `?secret=` query param before comparing the base URL — a webhook
    // registered with the query-param fallback still points at the right place.
    const registeredBase = registeredUrl ? registeredUrl.split("?")[0] : null;

    const needsRepair =
      !registeredBase || registeredBase !== expectedUrl || !!w.last_error_date;

    if (!needsRepair) {
      return {
        checked: true,
        action: "none",
        registeredUrl,
        expectedUrl,
        pendingUpdateCount,
        lastError,
      };
    }

    // Re-assert the webhook with secret_token so Telegram sends the header the
    // route validates. (Also keep the ?secret= query param as a belt-and-braces
    // fallback the route now accepts too.)
    const body: Record<string, unknown> = {
      url: secret ? `${expectedUrl}?secret=${secret}` : expectedUrl,
      allowed_updates: ["message", "channel_post"],
    };
    if (secret) body.secret_token = secret;

    const setRes = await fetch(`${api}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const setData = await setRes.json();

    if (!setData.ok) {
      return {
        checked: true,
        action: "error",
        reason: setData.description || "setWebhook failed",
        registeredUrl,
        expectedUrl,
        pendingUpdateCount,
        lastError,
      };
    }

    return {
      checked: true,
      action: "repaired",
      reason: !registeredBase
        ? "webhook was not set"
        : registeredBase !== expectedUrl
          ? `wrong url (was ${registeredBase})`
          : `last delivery error: ${lastError ?? "unknown"}`,
      registeredUrl,
      expectedUrl,
      pendingUpdateCount,
      lastError,
    };
  } catch (err) {
    return {
      checked: true,
      action: "error",
      reason: err instanceof Error ? err.message : String(err),
      expectedUrl,
    };
  }
}
