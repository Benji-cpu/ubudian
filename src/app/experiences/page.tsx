import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { JourneyCard } from "@/components/journeys/journey-card";
import { WhatsIncludedIcons } from "@/components/journeys/whats-included-icons";
import { DifferentiatorStrip } from "@/components/journeys/differentiator-strip";
import { WordReveal } from "@/components/ui/word-reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { GrainTexture } from "@/components/ui/grain-texture";
import { Button } from "@/components/ui/button";
import { rankJourneysByArchetype } from "@/lib/journeys/journey-personalization";
import type { ArchetypeId, Journey, QuizResultRecord } from "@/types";

const LISTING_HERO_IMAGE =
  "https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/experiences/1778200913187-listing-hero.png";

export const metadata: Metadata = {
  title: "Ubud Retreats",
  description:
    "An introduction into Ubud's conscious community — practitioners, circles, and tables that don't open easily. Small cohort, luxury villa, four to eight people, hand-picked for fit.",
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
      {/* Hero — scene-introduction, not amenity-led */}
      <section className="relative overflow-hidden bg-brand-cream px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
        {/* Atmospheric backdrop image, dialled back so the cream + grain register stays */}
        <Image
          src={LISTING_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover opacity-[0.18]"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-cream/80 via-brand-cream/65 to-brand-cream"
          aria-hidden
        />
        <GrainTexture opacity={0.05} />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="block text-xs uppercase tracking-[0.3em] text-brand-gold">
            Ubud Retreats
          </span>
          <div className="mx-auto my-6 h-px w-12 bg-brand-gold/50" />
          <WordReveal
            as="h1"
            startOnMount
            staggerMs={70}
            text="A soft landing into the scene we've been writing about."
            className="font-serif text-4xl font-medium leading-[1.15] tracking-tight text-brand-deep-green sm:text-5xl md:text-[3.5rem]"
          />
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
            Ubud&apos;s conscious community lives behind soft doors — practitioners
            who don&apos;t advertise, circles that don&apos;t take strangers,
            tables you have to be brought to. Come for a few days. Villa sorted,
            meals handled, three or four introductions to the people we trust
            most. You leave with phone numbers, not just photographs.
          </p>
        </div>
      </section>

      {/* Differentiator — the typographic moment */}
      <DifferentiatorStrip />

      {/* What an Ubud Retreat actually delivers — icon row */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <ScrollReveal>
          <div className="mb-8 text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
              What you actually get
            </span>
            <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
              Six promises, kept quietly
            </h2>
          </div>
        </ScrollReveal>
        <ScrollReveal delayMs={150}>
          <WhatsIncludedIcons variant="card" />
        </ScrollReveal>
      </section>

      {/* The retreats themselves */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-10 flex items-end justify-between border-b border-brand-gold/20 pb-4">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
                The cohorts
              </span>
              <h2 className="mt-2 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                Four to eight people, hand-picked
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/65">
                Each retreat runs a few times a year. Apply for the week that
                resonates and we&apos;ll come back within three days.
              </p>
            </div>
            {primary && (
              <span className="hidden text-xs uppercase tracking-[0.2em] text-brand-gold sm:block">
                Surfaced for The {primary[0].toUpperCase() + primary.slice(1)}
              </span>
            )}
          </div>
        </ScrollReveal>

        {livingGuides.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-lg italic text-muted-foreground">
              The first cohorts are being threaded together. Back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {livingGuides.map((j, i) => (
              <ScrollReveal key={j.id} delayMs={i * 100}>
                <JourneyCard journey={j} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* Free Living Guide — secondary panel, the Ekumal tiered-access pattern */}
      <section className="border-t border-brand-gold/15 bg-brand-cream/50 px-4 py-16 sm:px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
              Or follow it yourself
            </span>
            <h2 className="mt-3 font-serif text-2xl font-medium italic text-brand-deep-green sm:text-3xl">
              Living Guides — same curation, free
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/70">
              If a cohort doesn&apos;t fit your dates, or the budget isn&apos;t
              there, the curated itinerary is yours to follow. You handle the
              villa and the bookings; we keep the recipe up to date. The doors
              we open in cohort weeks stay closed in self-serve mode — that&apos;s
              the difference. Use the guides as a soft start.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link href="/membership">Read about Living Guides</Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>

      {/* Quiz CTA */}
      <section className="bg-brand-pale-green/60 px-4 py-16">
        <ScrollReveal>
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
              Not sure which week is yours?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground/70">
              Take the quiz. We&apos;ll surface the retreat that lines up with
              where you&apos;re standing now — and the practitioners we&apos;d
              introduce you to first.
            </p>
            <Button asChild className="mt-6">
              <Link href="/quiz">Take the Quiz</Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
