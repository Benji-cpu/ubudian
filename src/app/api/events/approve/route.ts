import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the event to find the submitter email
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("submitted_by_email")
      .eq("id", event_id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
