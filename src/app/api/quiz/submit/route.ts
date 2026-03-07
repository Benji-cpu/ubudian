import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { addSubscriberWithArchetype } from "@/lib/beehiiv";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const quizSubmitSchema = z.object({
  primary_archetype: z.string().min(1).max(100),
  secondary_archetype: z.string().max(100).nullable().optional(),
  scores: z.record(z.string(), z.number()),
  answers: z.record(z.string(), z.string()),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`quiz-submit:${ip}`, { limit: 10, windowSeconds: 900 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = quizSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quiz data" },
        { status: 400 }
      );
    }

    const { primary_archetype, secondary_archetype, scores, answers, email } = parsed.data;

    const supabase = createAdminClient();

    // Check if user is authenticated to link quiz result to profile
    let profileId: string | null = null;
    try {
      const serverClient = await createClient();
      const { data: { user } } = await serverClient.auth.getUser();
      if (user) {
        profileId = user.id;
      }
    } catch {
      // Not authenticated — that's fine
    }

    // Insert quiz result
    const { error: quizError } = await queryWithRetry(
      () =>
        supabase.from("quiz_results").insert({
          primary_archetype,
          secondary_archetype,
          scores,
          answers,
          email: email || null,
          ...(profileId ? { profile_id: profileId } : {}),
        }),
      "quiz-submit-insert"
    );

    if (quizError) {
      console.error("Quiz submit error:", quizError);
      return NextResponse.json(
        { error: "Failed to save quiz results" },
        { status: 500 }
      );
    }

    // If email provided, upsert newsletter subscriber
    if (email && typeof email === "string") {
      const normalizedEmail = email.toLowerCase().trim();

      const { error: subError } = await queryWithRetry(
        () =>
          supabase
            .from("newsletter_subscribers")
            .upsert(
              {
                email: normalizedEmail,
                source: "quiz",
                archetype: primary_archetype,
              },
              { onConflict: "email" }
            ),
        "quiz-submit-subscribe"
      );

      if (subError) {
        console.error("Newsletter subscriber upsert error:", subError);
      }

      // Sync to Beehiiv with archetype
      const beehiivId = await addSubscriberWithArchetype(normalizedEmail, primary_archetype);
      if (beehiivId) {
        await supabase
          .from("newsletter_subscribers")
          .update({ beehiiv_subscriber_id: beehiivId })
          .eq("email", normalizedEmail);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
