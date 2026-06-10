import { createHmac, timingSafeEqual } from "crypto";

// Stateless unsubscribe tokens: HMAC-SHA256 of the lowercased email, keyed by
// EMAIL_UNSUB_SECRET (falls back to CRON_SECRET so links work before the
// dedicated secret lands in Vercel). The token only grants the ability to set
// email_opt_out=true for that one address — worst case for a leaked token is
// an unwanted unsubscribe, so stateless is proportionate.

function secret(): string {
  const s = process.env.EMAIL_UNSUB_SECRET || process.env.CRON_SECRET;
  if (!s) throw new Error("EMAIL_UNSUB_SECRET / CRON_SECRET not configured");
  return s.trim();
}

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret())
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function unsubscribeUrl(email: string, siteUrl: string): string {
  const params = new URLSearchParams({
    email: email.toLowerCase().trim(),
    token: unsubscribeToken(email),
  });
  return `${siteUrl}/api/email/unsubscribe?${params.toString()}`;
}
