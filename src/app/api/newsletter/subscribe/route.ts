import { createAdminClient } from "@/lib/supabase/admin";
import { queryWithRetry } from "@/lib/supabase/retry";
import { addSubscriber } from "@/lib/beehiiv";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`newsletter-subscribe:${ip}`, { limit: 5, windowSeconds: 900 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { email } = await request.json();

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

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    // Insert subscriber (upsert to handle duplicates gracefully)
    const { error } = await queryWithRetry(
      () =>
        supabase
          .from("newsletter_subscribers")
          .upsert(
            { email: normalizedEmail, source: "website" },
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
    const beehiivId = await addSubscriber(normalizedEmail);
    if (beehiivId) {
      await supabase
        .from("newsletter_subscribers")
        .update({ beehiiv_subscriber_id: beehiivId })
        .eq("email", normalizedEmail);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
