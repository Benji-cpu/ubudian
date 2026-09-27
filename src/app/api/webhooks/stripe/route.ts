import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatUsdPrice } from "@/lib/stripe/helpers";
import { sendTransactionalEmail } from "@/lib/email";
import {
  bookingConfirmation,
  bookingNotificationAdmin,
} from "@/lib/email-templates";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Respond immediately, process in background
  after(async () => {
    try {
      await handleStripeEvent(event);
    } catch (err) {
      console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    }
  });

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  const supabase = createAdminClient();

  switch (event.type) {
    // ========================
    // CHECKOUT COMPLETED
    // ========================
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      // Tour bookings are the only checkout (membership and sponsorship were
      // deleted 27 Sep 2026; the shared Stripe account may still send others).
      if (type === "tour_booking") {
        await handleBookingCheckoutCompleted(supabase, session);
      }
      break;
    }

    // ========================
    // CHECKOUT EXPIRED
    // ========================
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === "tour_booking" && session.metadata?.booking_id) {
        // Cancel the pending booking
        await supabase
          .from("bookings")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", session.metadata.booking_id)
          .eq("status", "pending"); // Only if still pending
      }
      break;
    }

    // ========================
    // PAYMENT INTENT
    // ========================
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      // Update any payment records
      await supabase
        .from("payments")
        .update({
          status: "succeeded",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", pi.id);

      // Also update booking if linked
      await supabase
        .from("bookings")
        .update({
          stripe_payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }

    // ========================
    // CHARGE REFUNDED
    // ========================
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await supabase
        .from("payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("stripe_charge_id", charge.id);
      break;
    }

    default:
      console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function handleBookingCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;

  // Confirm booking — only if still pending (idempotency)
  const { data: booking } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      stripe_payment_status: "paid",
      stripe_payment_intent_id: session.payment_intent as string,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select("*, tours(title)")
    .single();

  if (!booking) return; // Already processed or not found

  // Record payment
  await supabase.from("payments").insert({
    profile_id: booking.profile_id,
    payment_type: "tour_booking",
    booking_id: booking.id,
    stripe_payment_intent_id: session.payment_intent as string,
    stripe_charge_id: null,
    amount: booking.total_amount,
    currency: booking.currency,
    status: "succeeded",
  });

  // Send confirmation email to guest
  const tourTitle = (booking as { tours?: { title: string } }).tours?.title ?? "Tour";
  const totalFormatted = formatUsdPrice(booking.total_amount);

  await sendTransactionalEmail(
    booking.guest_email,
    `Booking Confirmed — ${booking.booking_reference}`,
    bookingConfirmation({
      guestName: booking.guest_name,
      tourTitle,
      bookingReference: booking.booking_reference,
      preferredDate: booking.preferred_date,
      numGuests: booking.num_guests,
      totalAmount: totalFormatted,
    })
  );

  // Notify admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendTransactionalEmail(
      adminEmail,
      `New Booking: ${booking.booking_reference}`,
      bookingNotificationAdmin({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        tourTitle,
        bookingReference: booking.booking_reference,
        preferredDate: booking.preferred_date,
        numGuests: booking.num_guests,
        totalAmount: totalFormatted,
      })
    );
  }
}
