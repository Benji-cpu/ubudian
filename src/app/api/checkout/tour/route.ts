import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/server";
import { generateBookingReference } from "@/lib/stripe/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bookingSchema = z.object({
  tour_id: z.string().uuid(),
  guest_name: z.string().min(1, "Name is required").max(200),
  guest_email: z.string().email("Valid email required"),
  guest_phone: z.string().max(30).optional(),
  num_guests: z.number().int().min(1).max(50),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  special_requests: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    const supabaseAdmin = createAdminClient();

    // Fetch tour to get pricing
    const { data: tour, error: tourError } = await supabaseAdmin
      .from("tours")
      .select("id, title, price_per_person, max_group_size, is_active, slug")
      .eq("id", data.tour_id)
      .single();

    if (tourError || !tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    if (!tour.is_active) {
      return NextResponse.json({ error: "This tour is no longer available" }, { status: 400 });
    }

    if (!tour.price_per_person) {
      return NextResponse.json({ error: "Tour pricing not configured" }, { status: 400 });
    }

    if (tour.max_group_size && data.num_guests > tour.max_group_size) {
      return NextResponse.json(
        { error: `Maximum group size is ${tour.max_group_size}` },
        { status: 400 }
      );
    }

    const totalAmount = tour.price_per_person * data.num_guests;
    const bookingReference = generateBookingReference();

    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        tour_id: data.tour_id,
        profile_id: user?.id ?? null,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone ?? null,
        num_guests: data.num_guests,
        preferred_date: data.preferred_date,
        special_requests: data.special_requests ?? null,
        price_per_person: tour.price_per_person,
        total_amount: totalAmount,
        currency: "usd",
        status: "pending",
        stripe_payment_status: "unpaid",
        booking_reference: bookingReference,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("[checkout/tour] Failed to create booking:", bookingError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "usd",
      customer_email: data.guest_email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tour.title,
              description: `${data.num_guests} guest${data.num_guests > 1 ? "s" : ""} — ${data.preferred_date}`,
            },
            unit_amount: tour.price_per_person,
          },
          quantity: data.num_guests,
        },
      ],
      metadata: {
        booking_id: booking.id,
        booking_reference: bookingReference,
        tour_id: data.tour_id,
        type: "tour_booking",
      },
      success_url: `${siteUrl}/booking/success?ref=${bookingReference}`,
      cancel_url: `${siteUrl}/booking/cancel?ref=${bookingReference}`,
    });

    // Update booking with Stripe session ID
    await supabaseAdmin
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({
      url: session.url,
      booking_reference: bookingReference,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid booking data", details: err.issues },
        { status: 400 }
      );
    }
    console.error("[checkout/tour] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
