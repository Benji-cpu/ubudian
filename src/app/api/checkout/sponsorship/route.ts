import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/server";
import { getOrCreateSponsorCustomer } from "@/lib/stripe/sponsor-customer";
import { getSponsorPriceId } from "@/lib/stripe/sponsor-pricing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/constants";
import type { Sponsor, SponsorTier } from "@/types";

const checkoutSchema = z.object({
  sponsor_id: z.string().uuid(),
  tier: z.enum(["patron", "partner", "anchor"]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in first to start your subscription." },
        { status: 401 }
      );
    }

    const ip = getClientIp(request);
    const { success } = rateLimit(`checkout-sponsor:${ip}`, { limit: 5, windowSeconds: 900 });
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = checkoutSchema.parse(await request.json());

    // Sponsor must be claimed by this profile (or the caller must be admin).
    const admin = createAdminClient();
    const { data: sponsorRow, error: sponsorErr } = await admin
      .from("sponsors")
      .select("*")
      .eq("id", body.sponsor_id)
      .maybeSingle();
    if (sponsorErr || !sponsorRow) {
      return NextResponse.json({ error: "Partner profile not found." }, { status: 404 });
    }
    const sponsor = sponsorRow as Sponsor;

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isAdminUser = (profile as { role?: string } | null)?.role === "admin";
    if (sponsor.claimed_by_profile_id !== user.id && !isAdminUser) {
      return NextResponse.json(
        { error: "This partner profile isn't linked to your account yet." },
        { status: 403 }
      );
    }

    const priceId = getSponsorPriceId(body.tier as SponsorTier);
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Sponsorship pricing isn't configured yet. Reach out to Benji and we'll send an invoice in the meantime.",
        },
        { status: 503 }
      );
    }

    const customerId = await getOrCreateSponsorCustomer(sponsor);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          type: "sponsorship",
          sponsor_id: sponsor.id,
          tier: body.tier,
        },
        subscription_data: {
          metadata: {
            type: "sponsorship",
            sponsor_id: sponsor.id,
            tier: body.tier,
          },
        },
        success_url: `${SITE_URL}/sponsor/dashboard?subscribed=true`,
        cancel_url: `${SITE_URL}/sponsor/dashboard?cancelled=true`,
      },
      { idempotencyKey: `sponsor-checkout:${sponsor.id}:${priceId}` }
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[checkout/sponsorship] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
