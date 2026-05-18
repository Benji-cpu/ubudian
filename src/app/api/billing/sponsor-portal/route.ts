import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";
import type { Sponsor } from "@/types";

const schema = z.object({ sponsor_id: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Must be logged in" }, { status: 401 });
    }

    const { sponsor_id } = schema.parse(await request.json());

    const admin = createAdminClient();
    const { data: sponsorRow } = await admin
      .from("sponsors")
      .select("*")
      .eq("id", sponsor_id)
      .maybeSingle();
    const sponsor = sponsorRow as Sponsor | null;
    if (!sponsor) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isAdminUser = (profile as { role?: string } | null)?.role === "admin";
    if (sponsor.claimed_by_profile_id !== user.id && !isAdminUser) {
      return NextResponse.json({ error: "Not your partner profile" }, { status: 403 });
    }

    if (!sponsor.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account yet. Start a subscription first." },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: sponsor.stripe_customer_id,
      return_url: `${SITE_URL}/sponsor/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[billing/sponsor-portal] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
