import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { addSubscriberWithArchetype } from "@/lib/beehiiv";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { buildSpread } from "@/lib/quiz/build-spread";
import { buildSpreadEmailHtml } from "@/lib/email/spread-email";
import { sendTransactionalEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import { NextResponse, after } from "next/server";
import { z } from "zod";
import type { ArchetypeId, Event, Experience } from "@/types";

const quizSubmitSchema = z.object({
  primary_archetype: z.string().min(1).max(100),
  secondary_archetype: z.string().max(100).nullable().optional(),
  scores: z.record(z.string(), z.number()),
  answers: z.record(z.string(), z.string()),
  email: z.string().email().optional().or(z.literal("")),
  user_segment: z.enum(["curious", "visiting", "local"]).optional(),
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

    const { primary_archetype, secondary_archetype, scores, answers, email, user_segment } = parsed.data;

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

    // Insert quiz result (capture id to link the saved spread)
    const { data: quizRow, error: quizError } = await queryWithRetry(
      () =>
        supabase
          .from("quiz_results")
          .insert({
            primary_archetype,
            secondary_archetype,
            scores,
            answers,
            email: email || null,
            user_segment: user_segment || null,
            ...(profileId ? { profile_id: profileId } : {}),
          })
          .select("id")
          .single(),
      "quiz-submit-insert"
    );
    const quizResultId = (quizRow as { id: string } | null)?.id ?? null;

    if (quizError) {
      console.error("Quiz submit error:", quizError);
      return NextResponse.json(
        { error: "Failed to save quiz results" },
        { status: 500 }
      );
    }

    // If authenticated, update profile with archetype and segment
    if (profileId) {
      await supabase
        .from("profiles")
        .update({
          primary_archetype,
          user_segment: user_segment || null,
        })
        .eq("id", profileId);
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

    // Build the custom spread → persist it for logged-in takers and email it so
    // it isn't lost once they browse the general feed. Deferred via after() so
    // the result render isn't blocked by the queries + Resend call.
    const isValidArchetype = ARCHETYPE_IDS.includes(primary_archetype as ArchetypeId);
    const spreadEmail = email && typeof email === "string" ? email.toLowerCase().trim() : null;
    if (isValidArchetype && (profileId || spreadEmail)) {
      const primary = primary_archetype as ArchetypeId;
      after(async () => {
        try {
          const admin = createAdminClient();
          const today = new Date().toISOString().split("T")[0];
          const [evRes, expRes] = await Promise.all([
            admin
              .from("events")
              .select("*")
              .eq("status", "approved")
              .gte("start_date", today)
              .order("start_date", { ascending: true })
              .limit(60),
            admin
              .from("experiences")
              .select("*")
              .eq("is_active", true)
              .order("sort_order", { ascending: true })
              .limit(20),
          ]);
          const spread = buildSpread(
            primary,
            (evRes.data ?? []) as Event[],
            (expRes.data ?? []) as Experience[]
          );
          if (spread.events.length === 0 && spread.experiences.length === 0) return;

          if (profileId) {
            await admin.from("saved_spreads").insert({
              profile_id: profileId,
              quiz_result_id: quizResultId,
              primary_archetype,
              secondary_archetype: secondary_archetype ?? null,
              event_ids: spread.events.map((e) => e.id),
              experience_ids: spread.experiences.map((x) => x.id),
            });
          }

          if (spreadEmail && spread.events.length > 0) {
            const html = buildSpreadEmailHtml({
              primary,
              events: spread.events,
              experiences: spread.experiences,
              siteUrl: SITE_URL,
            });
            await sendTransactionalEmail(
              spreadEmail,
              "Your Ubud spirit + a spread picked for you",
              html
            );
          }
        } catch (err) {
          console.error("[quiz-submit] spread persist/email failed:", err);
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
