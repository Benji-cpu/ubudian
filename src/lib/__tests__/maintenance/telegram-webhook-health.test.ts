import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ensureTelegramWebhook } from "@/lib/maintenance/telegram-webhook-health";

// The result is committed nightly to a public repo (digests/*.json), so the
// webhook secret must never appear in it — it leaked that way from June to
// September 2026 because Telegram echoes back the `?secret=` it was set with.
describe("ensureTelegramWebhook", () => {
  const SECRET = "live-webhook-secret-123";
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "bot-token");
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", SECRET);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://theubudian.life");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  function webhookInfo(result: Record<string, unknown>) {
    return { json: async () => ({ ok: true, result }) } as Response;
  }

  it("never returns the secret when the webhook is healthy", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      webhookInfo({ url: `https://theubudian.life/api/webhooks/telegram?secret=${SECRET}` }),
    );

    const health = await ensureTelegramWebhook();

    expect(health.action).toBe("none");
    expect(JSON.stringify(health)).not.toContain(SECRET);
    expect(health.registeredUrl).toBe("https://theubudian.life/api/webhooks/telegram?secret=[redacted]");
  });

  it("never returns the secret after repairing the webhook", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        webhookInfo({
          url: `https://theubudian.life/api/webhooks/telegram?secret=${SECRET}`,
          last_error_date: 1,
          last_error_message: "Wrong response from the webhook: 401 Unauthorized",
        }),
      )
      .mockResolvedValueOnce({ json: async () => ({ ok: true }) } as Response);

    const health = await ensureTelegramWebhook();

    expect(health.action).toBe("repaired");
    expect(JSON.stringify(health)).not.toContain(SECRET);
  });
});
