import { beforeAll, describe, expect, it } from "vitest";
import {
  unsubscribeToken,
  verifyUnsubscribeToken,
  unsubscribeUrl,
} from "@/lib/email/unsubscribe";

beforeAll(() => {
  process.env.EMAIL_UNSUB_SECRET = "test-secret";
});

describe("unsubscribe tokens", () => {
  it("round-trips: a generated token verifies", () => {
    const token = unsubscribeToken("Someone@Example.com");
    expect(verifyUnsubscribeToken("someone@example.com", token)).toBe(true);
  });

  it("is case/whitespace-insensitive on email", () => {
    expect(unsubscribeToken("  A@B.COM ")).toBe(unsubscribeToken("a@b.com"));
  });

  it("rejects a token for a different email", () => {
    const token = unsubscribeToken("a@b.com");
    expect(verifyUnsubscribeToken("c@d.com", token)).toBe(false);
  });

  it("rejects tampered tokens without throwing", () => {
    expect(verifyUnsubscribeToken("a@b.com", "deadbeef")).toBe(false);
    expect(verifyUnsubscribeToken("a@b.com", "")).toBe(false);
  });

  it("builds a complete unsubscribe URL", () => {
    const url = unsubscribeUrl("a@b.com", "https://theubudian.life");
    expect(url).toContain("https://theubudian.life/api/email/unsubscribe?");
    expect(url).toContain("email=a%40b.com");
    expect(url).toContain(`token=${unsubscribeToken("a@b.com")}`);
  });
});
