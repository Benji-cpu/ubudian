import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { moderateEvent } from "@/lib/events/moderation";
import { safeUrlOrEmpty } from "@/lib/url-validation";
import { NextResponse } from "next/server";
import { z } from "zod";

// Organizer self-serve: a signed-in submitter edits their own event. Same
// field set as the submission schema minus submitted_by_email (ownership is
// not transferable) and the honeypot (authed route). Whitelist-only update —
// status/slug/tier/sponsorship are never writable here. Edited content
// re-runs the same moderation gate as creation; a pass keeps the event live
// (consistent with instant-publish — there is no human review queue).
const updateSchema = z.object({
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
  is_recurring: z.boolean().optional().default(false),
  recurrence_rule: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`event-update:${ip}`, { limit: 10, windowSeconds: 900 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const profile = await getCurrentProfile();
  if (!profile?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
    }
    const data = parsed.data;

    const supabase = createAdminClient();
    const { data: event } = await supabase
      .from("events")
      .select("id, submitted_by_email, status")
      .eq("id", id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (
      !event.submitted_by_email ||
      event.submitted_by_email.toLowerCase() !== profile.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "You can only edit events you submitted" }, { status: 403 });
    }
    if (event.status === "rejected") {
      return NextResponse.json(
        { error: "This event was rejected — submit it as a new event instead" },
        { status: 409 }
      );
    }

    const moderation = await moderateEvent({
      title: data.title,
      description: data.description,
      organizer_name: data.organizer_name,
      venue_name: data.venue_name || null,
      source_url: data.external_ticket_url || null,
      origin: "user_submission",
    });
    if (!moderation.ok) {
      return NextResponse.json(
        {
          error:
            "We couldn't publish this edit. " +
            (moderation.reason || "Please review and try again."),
          flag: moderation.flag,
        },
        { status: 422 }
      );
    }

    const { error } = await supabase
      .from("events")
      .update({
        title: data.title,
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
        recurrence_rule: data.is_recurring ? data.recurrence_rule || null : null,
        last_edited_by_submitter_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[event-update] failed:", error);
      return NextResponse.json({ error: "Failed to save changes. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
