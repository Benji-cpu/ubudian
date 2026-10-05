/**
 * POST /api/cron/events-bus/report — the routine's monthly curation report.
 * Stored in `curation_reports` (shown at /admin/curation) and emailed once to
 * ADMIN_EMAIL. Re-posting the same month updates the text without re-sending.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEventsBusAuthorised } from "@/lib/events-bus/auth";
import { busReportSchema } from "@/lib/events-bus/schema";
import { reportToHtml } from "@/lib/events-bus/report-html";
import { sendTransactionalEmail } from "@/lib/email";

export async function POST(request: Request) {
  if (!isEventsBusAuthorised(request.headers.get("authorization"))) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  let body: z.infer<typeof busReportSchema>;
  try {
    body = busReportSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ data: null, error: "Invalid report body" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("curation_reports")
    .select("emailed_at")
    .eq("month", body.month)
    .maybeSingle();

  const { error } = await supabase
    .from("curation_reports")
    .upsert({ month: body.month, markdown: body.markdown }, { onConflict: "month" });
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });

  let emailed = !!existing?.emailed_at;
  const to = process.env.ADMIN_EMAIL;
  if (!emailed && to) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://theubudian.life";
    const html =
      `<p style="font-family:system-ui,sans-serif;font-size:14px">The events desk's report for ${body.month}. ` +
      `Also at <a href="${site}/admin/curation">${site}/admin/curation</a>. Nothing here needs a reply; tell the Ubudian room if something looks off.</p>` +
      reportToHtml(body.markdown);
    emailed = await sendTransactionalEmail(to, `The Ubudian: what's on in Ubud, ${body.month}`, html);
    if (emailed) {
      await supabase.from("curation_reports").update({ emailed_at: new Date().toISOString() }).eq("month", body.month);
    }
  }

  return NextResponse.json({ data: { month: body.month, emailed }, error: null });
}
