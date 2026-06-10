import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Send a transactional email via Resend.
 * Never throws — returns true on accepted send, false otherwise, so callers
 * that keep a send ledger can record the real outcome.
 */
export async function sendTransactionalEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured, skipping email to", to);
    return false;
  }

  try {
    const r = getResend();
    const { error } = await r.emails.send({
      // theubudian.life is the Resend-verified domain (added 2026-06-10;
      // the old .com from-address was never verified, so every send bounced).
      from: "The Ubudian <hello@theubudian.life>",
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[email] Resend rejected email:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}
