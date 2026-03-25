import { describe, it, expect, beforeEach, vi } from "vitest";
import { getEnv, _resetEnvCache } from "@/lib/env";

const VALID_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_WEBHOOK_SECRET: "whsec_test_123",
  GEMINI_API_KEY: "test-gemini-key",
  RESEND_API_KEY: "test-resend-key",
  CRON_SECRET: "test-cron-secret",
};

describe("getEnv", () => {
  beforeEach(() => {
    _resetEnvCache();
    vi.unstubAllEnvs();
  });

  it("returns validated env when all required vars are present", () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }

    const env = getEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test_123");
  });

  it("throws with specific missing vars when required vars are absent", () => {
    // Set only some vars
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");

    expect(() => getEnv()).toThrow("Missing or invalid environment variables");
    expect(() => getEnv()).toThrow("STRIPE_SECRET_KEY");
  });

  it("throws when STRIPE_SECRET_KEY doesn't start with sk_", () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("STRIPE_SECRET_KEY", "bad_key");

    expect(() => getEnv()).toThrow("STRIPE_SECRET_KEY");
  });

  it("throws when SUPABASE_URL is not a valid URL", () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");

    expect(() => getEnv()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("caches the result after first call", () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }

    const first = getEnv();
    const second = getEnv();
    expect(first).toBe(second);
  });

  it("accepts optional vars when present", () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:ABC");

    const env = getEnv();
    expect(env.TELEGRAM_BOT_TOKEN).toBe("123:ABC");
  });

  it("allows optional vars to be absent", () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }

    const env = getEnv();
    expect(env.TELEGRAM_BOT_TOKEN).toBeUndefined();
  });
});
