import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";

const leadSchema = z.object({
  business_name: z.string().min(1).max(120),
  contact_name: z.string().max(120).optional().or(z.literal("")),
  contact_email: z.string().email().max(200),
  contact_whatsapp: z.string().max(50).optional().or(z.literal("")),
  website_url: z.string().url().max(500).optional().or(z.literal("")),
  tier_interest: z.enum(["unsure", "patron", "partner", "anchor"]).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  // Honeypot — bots fill this; humans never see it.
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`sponsor-lead:${ip}`, { limit: 3, windowSeconds: 600 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof leadSchema>;
  try {
    const json = await request.json();
    body = leadSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Honeypot trip — silently succeed (don't tip off the bot) but skip the insert.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const tierInterest = body.tier_interest ? body.tier_interest : null;

  const supabase = createAdminClient();
  const { error } = await supabase.from("sponsor_leads").insert({
    business_name: body.business_name,
    contact_name: body.contact_name || null,
    contact_email: body.contact_email,
    contact_whatsapp: body.contact_whatsapp || null,
    website_url: body.website_url || null,
    tier_interest: tierInterest,
    message: body.message || null,
  });

  if (error) {
    console.error("[sponsor-leads] insert error:", error);
    return NextResponse.json({ error: "Could not save your message" }, { status: 500 });
  }

  // Notify admin so Benji sees new leads without checking the inbox.
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      await sendTransactionalEmail(
        adminEmail,
        `New community-partner lead: ${body.business_name}`,
        `<p>A new partner inquiry just came in.</p>
<ul>
<li><strong>Business:</strong> ${escape(body.business_name)}</li>
<li><strong>Contact:</strong> ${escape(body.contact_name || "—")} · ${escape(body.contact_email)}</li>
<li><strong>WhatsApp:</strong> ${escape(body.contact_whatsapp || "—")}</li>
<li><strong>Website:</strong> ${escape(body.website_url || "—")}</li>
<li><strong>Tier:</strong> ${escape(tierInterest ?? "—")}</li>
</ul>
${body.message ? `<p><strong>Message:</strong></p><p>${escape(body.message).replace(/\n/g, "<br>")}</p>` : ""}
<p><a href="https://theubudian.life/admin/sponsors/leads">Open in admin inbox</a></p>`
      );
    } catch (err) {
      // Non-blocking — the lead is already saved.
      console.error("[sponsor-leads] admin email failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
