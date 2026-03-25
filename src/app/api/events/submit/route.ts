import { createAdminClient } from "@/lib/supabase/admin";
import { queryWithRetry } from "@/lib/supabase/retry";
import { slugify } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";
import { eventSubmissionConfirmation } from "@/lib/email-templates";
import { NextResponse } from "next/server";
import { z } from "zod";
import { safeUrlOrEmpty } from "@/lib/url-validation";

const submissionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  short_description: z.string().max(200).optional().or(z.literal("")),
  category: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  start_time: z.string().optional().or(z.literal("")),
  end_time: z.string().optional().or(z.literal("")),
  venue_name: z.string().optional().or(z.literal("")),
  venue_address: z.string().optional().or(z.literal("")),
  price_info: z.string().optional().or(z.literal("")),
  external_ticket_url: z.string().optional().or(z.literal("")).refine(safeUrlOrEmpty, "URL must use http or https"),
  organizer_name: z.string().min(1),
  organizer_contact: z.string().min(1),
  organizer_instagram: z.string().optional().or(z.literal("")),
  submitted_by_email: z.string().email(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_rule: z.string().nullable().optional(),
  website: z.string().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`event-submit:${ip}`, { limit: 5, windowSeconds: 900 });
  if (!success) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const data = submissionSchema.parse(body);

    // Honeypot check
    if (data.website) {
      return NextResponse.json({ success: true });
    }

    const supabase = createAdminClient();

    // Check if trusted submitter
    const { data: trusted } = await queryWithRetry(
      () =>
        supabase
          .from("trusted_submitters")
          .select("auto_approve")
          .eq("email", data.submitted_by_email.toLowerCase())
          .single(),
      "event-submit-trusted"
    );

    const autoApprove = (trusted as { auto_approve: boolean } | null)?.auto_approve ?? false;

    // Generate unique slug
    let slug = slugify(data.title);
    const { data: existing } = await queryWithRetry(
      () =>
        supabase
          .from("events")
          .select("slug")
          .eq("slug", slug)
          .single(),
      "event-submit-slug"
    );

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const { error } = await queryWithRetry(
      () =>
        supabase.from("events").insert({
          title: data.title,
          slug,
          description: data.description,
          short_description: data.short_description || null,
          category: data.category,
          start_date: data.start_date,
          end_date: data.end_date || null,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          venue_name: data.venue_name || null,
          venue_address: data.venue_address || null,
          price_info: data.price_info || null,
          external_ticket_url: data.external_ticket_url || null,
          organizer_name: data.organizer_name,
          organizer_contact: data.organizer_contact || null,
          organizer_instagram: data.organizer_instagram || null,
          is_recurring: data.is_recurring || false,
          recurrence_rule: data.recurrence_rule || null,
          submitted_by_email: data.submitted_by_email.toLowerCase(),
          is_trusted_submitter: autoApprove,
          status: autoApprove ? "approved" : "pending",
        }),
      "event-submit-insert"
    );

    if (error) {
      console.error("Event submission error:", error);
      return NextResponse.json(
        { error: "Failed to submit event. Please try again." },
        { status: 500 }
      );
    }

    // Fire-and-forget confirmation email
    sendTransactionalEmail(
      data.submitted_by_email,
      "Your event has been submitted!",
      eventSubmissionConfirmation(data.title, autoApprove)
    );

    return NextResponse.json({ success: true, autoApproved: autoApprove });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid submission data. Please check your form." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
