import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/email";
import { eventApprovedNotification, eventRejectedNotification } from "@/lib/email-templates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { event_id, action = "approve", rejection_reason } = body;

    if (!event_id) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the event details
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("submitted_by_email, title, slug")
      .eq("id", event_id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (action === "reject") {
      // Update event status to rejected
      const { error: updateError } = await supabase
        .from("events")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason || null,
        })
        .eq("id", event_id);

      if (updateError) {
        console.error("Event reject update error:", updateError);
        return NextResponse.json({ error: "Failed to reject event" }, { status: 500 });
      }

      // Send rejection email
      if (event.submitted_by_email) {
        sendTransactionalEmail(
          event.submitted_by_email,
          "Update on your event submission",
          eventRejectedNotification(event.title, rejection_reason)
        );
      }

      return NextResponse.json({ success: true });
    }

    // Default: approve
    const { error: approveError } = await supabase
      .from("events")
      .update({ status: "approved" })
      .eq("id", event_id);

    if (approveError) {
      console.error("Event approve update error:", approveError);
      return NextResponse.json({ error: "Failed to approve event" }, { status: 500 });
    }

    if (!event.submitted_by_email) {
      return NextResponse.json({ success: true, message: "No submitter email" });
    }

    // Increment the approved count (upserts + auto-promotes at 5)
    const { error: rpcError } = await supabase.rpc("increment_approved_count", {
      submitter_email: event.submitted_by_email.toLowerCase(),
    });

    if (rpcError) {
      console.error("increment_approved_count error:", rpcError);
      return NextResponse.json({ error: "Failed to update trusted submitter" }, { status: 500 });
    }

    // Send approval email
    sendTransactionalEmail(
      event.submitted_by_email,
      "Your event is live on The Ubudian!",
      eventApprovedNotification(event.title, event.slug)
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
