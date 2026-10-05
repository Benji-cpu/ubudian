/**
 * Resend inbound webhook: mail sent to any @theubudian.life address
 * (replies to newsletter@, hello@ …) arrives here as `email.received`.
 *
 * We forward it to the team inbox in INBOUND_FORWARD_TO, with the original
 * sender as reply-to so a reply from that inbox goes straight back to them.
 * The forward address lives only in env: this repo is public.
 */

import { NextResponse } from "next/server";
import { getResend } from "@/lib/email";

const FORWARD_FROM = "The Ubudian inbox <inbox@theubudian.life>";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  const forwardTo = process.env.INBOUND_FORWARD_TO;
  if (!secret || !forwardTo) {
    console.error("[resend-inbound] RESEND_INBOUND_WEBHOOK_SECRET or INBOUND_FORWARD_TO not set");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const resend = getResend();
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (event.type !== "email.received") return NextResponse.json({ data: "ignored" });

  const { data: email, error } = await resend.emails.receiving.get(event.data.email_id);
  if (error || !email) {
    console.error("[resend-inbound] fetch failed:", error);
    // 500 so Resend retries.
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  // Never forward our own forwards (a bounce or auto-reply could loop).
  if (email.from.includes("inbox@theubudian.life")) return NextResponse.json({ data: "skipped" });

  const header =
    `<p style="font:13px sans-serif;color:#666;margin:0 0 12px">` +
    `From ${escapeHtml(email.from)} to ${escapeHtml(email.to.join(", "))}` +
    (email.attachments.length > 0
      ? ` · ${email.attachments.length} attachment(s), kept in Resend → Emails → Receiving`
      : "") +
    `</p><hr>`;
  const body = email.html ?? `<pre style="white-space:pre-wrap">${escapeHtml(email.text ?? "")}</pre>`;

  const { error: sendError } = await resend.emails.send({
    from: FORWARD_FROM,
    to: forwardTo,
    replyTo: email.reply_to?.[0] ?? email.from,
    subject: email.subject || "(no subject)",
    html: header + body,
    text: `From ${email.from} to ${email.to.join(", ")}\n\n${email.text ?? ""}`,
  });
  if (sendError) {
    console.error("[resend-inbound] forward failed:", sendError);
    return NextResponse.json({ error: "Forward failed" }, { status: 500 });
  }
  return NextResponse.json({ data: "forwarded" });
}
