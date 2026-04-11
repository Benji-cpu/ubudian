import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/server";
import { getOrCreateStripeCustomer } from "@/lib/stripe/helpers";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/constants";

const subscriptionSchema = z.object({
  price_id: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Must be logged in to subscribe" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { success } = rateLimit(`checkout-sub:${ip}`, { limit: 5, windowSeconds: 900 });
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { price_id } = subscriptionSchema.parse(body);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email!,
      user.user_metadata?.full_name
    );

    // Create Stripe Checkout Session for subscription
    const stripe = getStripe();
    const siteUrl = SITE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price_id, quantity: 1 }],
      metadata: {
        profile_id: user.id,
        type: "subscription",
      },
      success_url: `${siteUrl}/dashboard/membership?success=true`,
      cancel_url: `${siteUrl}/membership?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[checkout/subscription] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
