import { createAdminClient } from "@/lib/supabase/admin";
import { queryWithRetry } from "@/lib/supabase/retry";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";
import { newsletterWelcome } from "@/lib/email-templates";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { SITE_URL } from "@/lib/constants";
import { NextResponse } from "next/server";
import type { ArchetypeId } from "@/types";

const VALID_ARCHETYPES: ArchetypeId[] = ["seeker", "explorer", "creative", "connector", "epicurean"];

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`newsletter-subscribe:${ip}`, { limit: 5, windowSeconds: 900 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { email, archetype, source } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate archetype if provided
    const validArchetype = typeof archetype === "string" && VALID_ARCHETYPES.includes(archetype as ArchetypeId)
      ? (archetype as ArchetypeId)
      : null;

    // Where they signed up, for counting what works; anything odd is just "website".
    const validSource =
      typeof source === "string" && /^[a-z_]{2,30}$/.test(source) ? source : "website";

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    // Insert subscriber (upsert to handle duplicates gracefully). Signing up
    // again after unsubscribing is a fresh yes, so it reactivates.
    const { error } = await queryWithRetry(
      () =>
        supabase
          .from("newsletter_subscribers")
          .upsert(
            {
              email: normalizedEmail,
              source: validSource,
              status: "active",
              ...(validArchetype && { archetype: validArchetype }),
            },
            { onConflict: "email" }
          ),
      "newsletter-subscribe"
    );

    if (error) {
      console.error("Newsletter subscribe error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    // The weekly digest skips opted-out profiles; this sign-up overrides an old opt-out.
    await supabase.from("profiles").update({ email_opt_out: false }).eq("email", normalizedEmail);

    // Fire-and-forget welcome email
    const unsubUrl = unsubscribeUrl(normalizedEmail, SITE_URL);
    sendTransactionalEmail(
      normalizedEmail,
      "Welcome to The Ubudian!",
      newsletterWelcome(unsubUrl),
      { unsubUrl }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
