import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { JourneyCard } from "@/components/journeys/journey-card";
import { Button } from "@/components/ui/button";
import { rankJourneysByArchetype } from "@/lib/journeys/journey-personalization";
import type { ArchetypeId, Journey, QuizResultRecord } from "@/types";

export const metadata: Metadata = {
  title: "Ubud Retreats | The Ubudian",
  description:
    "Curated retreats through Ubud's conscious-community scene — full-board paths of one good thing per day, with the villa sorted, rest built in, and room to meet people.",
};

export default async function ExperiencesPage() {
  let livingGuides: Journey[] = [];
  let primary: ArchetypeId | null = null;
  let secondary: ArchetypeId | null = null;

  try {
    const supabase = await createClient();

    const profile = await getCurrentProfile();
    if (profile) {
      const { data: quiz } = await supabase
        .from("quiz_results")
        .select("primary_archetype, secondary_archetype")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const q = quiz as Pick<QuizResultRecord, "primary_archetype" | "secondary_archetype"> | null;
      primary = (q?.primary_archetype as ArchetypeId) ?? null;
      secondary = (q?.secondary_archetype as ArchetypeId) ?? null;
    }

    const { data: journeys, error } = await supabase
      .from("journeys")
      .select("*")
      .eq("is_published", true)
      .eq("tier", "living_guide")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) console.error("Journeys query error:", error);
    livingGuides = rankJourneysByArchetype((journeys ?? []) as Journey[], { primary, secondary });
  } catch {
    // Supabase unreachable — render with empty state
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            Ubud Retreats
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Full-board retreats through Ubud&rsquo;s conscious-community scene —
            one good invitation per day, the villa and the meals taken care of,
            and room to eat slowly, wander into something unplanned, and meet
            people. Pick a thread and follow it.
          </p>
        </div>
      </section>

      {/* Public retreats — free to read, the discovery surface */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between border-b border-brand-gold/20 pb-3">
          <div>
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              The Retreats
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Free to read. Each retreat is a flexible recipe — a way of moving
              through Ubud, with current real events folded in and the villa,
              meals, and key practitioners curated.
            </p>
          </div>
          {primary && (
            <span className="hidden text-xs uppercase tracking-wider text-brand-gold sm:block">
              Sorted for The {primary[0].toUpperCase() + primary.slice(1)}
            </span>
          )}
        </div>

        {livingGuides.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              The first retreats are being threaded together. Back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {livingGuides.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        )}
      </section>

      {/* Self-Paced (Insider) preview */}
      <section className="border-t bg-brand-cream/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">
            Coming for Insiders
          </span>
          <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
            Self-paced retreats, threaded for you
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Begin a retreat on your own day one. Each morning we surface what
            today&apos;s invitation looks like — the right ceremony, the right walk,
            the right table to sit at — and quietly connect you to others on the
            same path. Insider opens later this season.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/membership">Read about Insider</Link>
          </Button>
        </div>
      </section>

      {/* Signature Cohort waitlist */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-terracotta">
            Signature Cohorts
          </span>
          <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
            A small handful, fully held
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            A few times a year we run a retreat ourselves — the villa, the table,
            the practitioners, the closing circle. Capped, hand-curated, all in
            one price. We&apos;ll announce the first cohort to subscribers first.
          </p>
          <Button asChild className="mt-6">
            <Link href="/newsletter">Join the list</Link>
          </Button>
        </div>
      </section>

      {/* Quiz CTA — kept from previous version */}
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Not sure which retreat fits?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Take the quiz. We&apos;ll show you the retreat that lines up with
            where you&apos;re standing now.
          </p>
          <Button asChild className="mt-6">
            <Link href="/quiz">Take the Quiz</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
