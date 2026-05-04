import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // Check if user is admin or booking owner
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isAdmin = profile?.role === "admin";
    const isOwner = booking.profile_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "cancelled" || booking.status === "refunded") {
      return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
    }

    // If payment was made, initiate refund
    if (booking.stripe_payment_intent_id && booking.stripe_payment_status === "paid") {
      const stripe = getStripe();
      await stripe.refunds.create(
        { payment_intent: booking.stripe_payment_intent_id },
        { idempotencyKey: `refund:${id}` }
      );

      await supabaseAdmin
        .from("bookings")
        .update({
          status: "refunded",
          stripe_payment_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Update payment record
      await supabaseAdmin
        .from("payments")
        .update({ status: "refunded" })
        .eq("booking_id", id);
    } else {
      await supabaseAdmin
        .from("bookings")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[bookings/cancel] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
