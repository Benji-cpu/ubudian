import { createAdminClient } from "@/lib/supabase/admin";
import { queryWithRetry } from "@/lib/supabase/retry";
import { addSubscriber, addSubscriberWithArchetype } from "@/lib/beehiiv";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";
import { newsletterWelcome } from "@/lib/email-templates";
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
    const { email, archetype } = await request.json();

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

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    // Insert subscriber (upsert to handle duplicates gracefully)
    const { error } = await queryWithRetry(
      () =>
        supabase
          .from("newsletter_subscribers")
          .upsert(
            {
              email: normalizedEmail,
              source: "website",
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

    // Also sync to Beehiiv (graceful fallback)
    const beehiivId = validArchetype
      ? await addSubscriberWithArchetype(normalizedEmail, validArchetype)
      : await addSubscriber(normalizedEmail);
    if (beehiivId) {
      await supabase
        .from("newsletter_subscribers")
        .update({ beehiiv_subscriber_id: beehiivId })
        .eq("email", normalizedEmail);
    }

    // Fire-and-forget welcome email
    sendTransactionalEmail(
      normalizedEmail,
      "Welcome to The Ubudian!",
      newsletterWelcome()
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
