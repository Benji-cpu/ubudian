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
 * Fire-and-forget — never throws, logs errors instead.
 */
export async function sendTransactionalEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured, skipping email to", to);
    return;
  }

  try {
    const r = getResend();
    await r.emails.send({
      from: "The Ubudian <hello@theubudian.com>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}
