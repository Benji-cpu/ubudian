import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ARCHETYPES, ARCHETYPE_IDS } from "@/lib/quiz-data";
import { getEventsForArchetype, getToursForArchetype, getStoriesForArchetype, getExperiencesForArchetype } from "@/lib/quiz-helpers";
import { getGuidesForArchetype } from "@/lib/guides/match-archetype";
import { getStarterPack } from "@/lib/guides/starter-packs";
import { getGuidesByRelatedSlugs } from "@/lib/guides/queries";
import { getSiteSettings } from "@/lib/site-settings";
import { QuizArchetypeCard } from "@/components/quiz/quiz-archetype-card";
import { EventCard } from "@/components/events/event-card";
import { TourCard } from "@/components/tours/tour-card";
import { StoryCard } from "@/components/stories/story-card";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { GuideCard } from "@/components/guides/guide-card";
import { RecommendedRetreatCta } from "@/components/journeys/recommended-retreat-cta";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/constants";
import type { ArchetypeId, Event, Tour, Story, Experience, Guide } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ archetype: string }>;
}

export async function generateStaticParams() {
  return ARCHETYPE_IDS.map((id) => ({ archetype: id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { archetype: slug } = await params;
  const archetype = ARCHETYPES[slug as ArchetypeId];
  if (!archetype) return {};

  return {
    title: `${archetype.name} — Ubud Spirit`,
    description: archetype.tagline + ". " + archetype.description.slice(0, 150) + "...",
    openGraph: {
      title: `I'm ${archetype.name}! Discover Your Ubud Spirit`,
      description: archetype.tagline,
      url: `${SITE_URL}/quiz/results/${slug}`,
      images: [
        {
          url: `${SITE_URL}/images/og/${slug}.jpg`,
          width: 1200,
          height: 630,
          alt: archetype.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `I'm ${archetype.name}! Discover Your Ubud Spirit`,
      description: archetype.tagline,
    },
  };
}

export default async function ArchetypeResultPage({ params }: PageProps) {
  const { archetype: slug } = await params;
  const archetype = ARCHETYPES[slug as ArchetypeId];
  if (!archetype) notFound();

  let events: Event[] = [];
  let tours: Tour[] = [];
  let stories: Story[] = [];
  let experiences: Experience[] = [];
  let guides: Guide[] = [];

  const settings = await getSiteSettings();

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const [eventsRes, toursRes, storiesRes, experiencesRes, guidesRes] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(20),
      supabase
        .from("tours")
        .select("*")
        .eq("is_active", true)
        .limit(12),
      supabase
        .from("stories")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(12),
      supabase
        .from("experiences")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(12),
      settings.guides_enabled
        ? supabase
            .from("guides")
            .select("*")
            .eq("status", "published")
            .order("sort_order", { ascending: true })
            .limit(24)
        : Promise.resolve({ data: [] as Guide[] }),
    ]);

    events = (eventsRes.data ?? []) as Event[];
    tours = (toursRes.data ?? []) as Tour[];
    stories = (storiesRes.data ?? []) as Story[];
    experiences = (experiencesRes.data ?? []) as Experience[];
    guides = (guidesRes.data ?? []) as Guide[];
  } catch {
    // Supabase unreachable — render with empty recommendations
  }

  const matchedExperiences = getExperiencesForArchetype(experiences, archetype.id);
  const matchedEvents = getEventsForArchetype(events, archetype.id);
  const matchedTours = getToursForArchetype(tours, archetype.id);
  const matchedStories = getStoriesForArchetype(stories, archetype.id);
  const matchedGuides = settings.guides_enabled
    ? getGuidesForArchetype(guides, archetype.id, 3)
    : [];

  // Starter pack — sequenced reading order keyed by archetype.
  const starterPack = settings.guides_enabled ? getStarterPack(archetype.id) : null;
  const starterGuides: Guide[] = starterPack
    ? await getGuidesByRelatedSlugs(starterPack.slugs)
    : [];

  const otherArchetypes = ARCHETYPE_IDS.filter((id) => id !== archetype.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-off-white to-brand-cream">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          <div className="relative aspect-[2/1] sm:aspect-[5/2]">
            <Image
              src={archetype.hero_image}
              alt={archetype.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
              Ubud Spirit
            </p>
            <h1 className="mt-1 font-serif text-4xl font-medium text-white sm:text-5xl">
              {archetype.name}
            </h1>
            <p className="mt-2 font-serif text-lg italic text-white/90">
              {archetype.tagline}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-lg leading-relaxed text-brand-charcoal-light">
          {archetype.description}
        </p>

        {/* Browse events for archetype */}
        <div className="mt-6">
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href={`/events?archetype=${archetype.id}`}>
              Browse all events for {archetype.name} &rarr;
            </Link>
          </Button>
        </div>
      </div>

      {/* Starter-pack panel — ordered reading sequence */}
      {starterPack && starterGuides.length > 0 && (
        <section className="border-y border-brand-gold/15 bg-brand-cream/40 py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-8 max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                Start here, in this order
              </p>
              <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
                A reading sequence for The {archetype.name}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-charcoal-light">
                {starterPack.intro}
              </p>
            </div>
            <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {starterGuides.map((g, i) => (
                <li key={g.id} className="flex flex-col">
                  <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold/50 font-serif text-sm text-brand-deep-green">
                    {i + 1}
                  </span>
                  <GuideCard
                    guide={g}
                    variant={g.tier === "intent" ? "intent-medium" : "practical"}
                  />
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Recommended retreat — full-bleed band */}
      <RecommendedRetreatCta primary={archetype.id} />

      <div className="mx-auto max-w-3xl px-4 pt-12">

        {/* Take the quiz CTA */}
        <div className="mt-8 rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-6 text-center">
          <p className="font-serif text-lg text-brand-charcoal">
            Not sure if you&apos;re {archetype.name}?
          </p>
          <Button asChild className="mt-3">
            <Link href="/quiz">Take the Quiz</Link>
          </Button>
        </div>

        {/* Recommended guides */}
        {matchedGuides.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Guides for {archetype.name}
            </h2>
            <p className="mt-2 text-brand-charcoal-light">
              Free, opinionated reading — start here.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchedGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  variant={guide.tier === "intent" ? "intent-medium" : "practical"}
                />
              ))}
            </div>
            <div className="mt-6">
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href={`/guides?archetype=${archetype.id}`}>
                  Browse all guides for {archetype.name} &rarr;
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Recommended experiences */}
        {matchedExperiences.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Experiences for {archetype.name}
            </h2>
            <p className="mt-2 text-brand-charcoal-light">
              Based on your archetype — the practices and gatherings that&apos;ll feel like home.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchedExperiences.map((experience) => (
                <ExperienceCard key={experience.id} experience={experience} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended events */}
        {matchedEvents.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Events for {archetype.name}
            </h2>
            <div className="mt-6 space-y-3">
              {matchedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended tours */}
        {matchedTours.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Tours for {archetype.name}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchedTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended stories */}
        {matchedStories.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              Humans of Ubud for {archetype.name}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchedStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        )}

        {/* Other archetypes */}
        <div className="mt-16">
          <h2 className="text-center font-serif text-2xl font-medium text-brand-charcoal">
            Explore Other Spirits
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {otherArchetypes.map((id) => (
              <QuizArchetypeCard key={id} archetype={ARCHETYPES[id]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
