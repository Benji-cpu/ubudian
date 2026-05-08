import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareButtons } from "@/components/blog/share-buttons";
import { JourneyCard } from "@/components/journeys/journey-card";
import { JourneyDayCard } from "@/components/journeys/journey-day-card";
import { JourneyJsonLd } from "@/components/journeys/journey-json-ld";
import { JourneyTestimonials } from "@/components/journeys/journey-testimonials";
import { JourneyFaq } from "@/components/journeys/journey-faq";
import { WhatsIncludedIcons } from "@/components/journeys/whats-included-icons";
import { DifferentiatorStrip } from "@/components/journeys/differentiator-strip";
import { CohortFacts } from "@/components/journeys/cohort-facts";
import { JourneyGuides } from "@/components/journeys/journey-guides";
import { JourneyDayTabs } from "@/components/journeys/journey-day-tabs";
import { JourneyMap } from "@/components/journeys/journey-map";
import { SaveJourneyButton } from "@/components/journeys/save-journey-button";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { resolveDayCandidates } from "@/lib/journeys/slot-resolver";
import {
  rankJourneysByArchetype,
  rankAtomsForUser,
} from "@/lib/journeys/journey-personalization";
import { getCurrentProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type {
  ArchetypeId,
  Journey,
  JourneyDay,
  JourneyDaySlot,
  JourneyAtom,
  JourneyTestimonial,
} from "@/types";

interface JourneyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JourneyPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: journey } = await supabase
      .from("journeys")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();
    if (!journey) return { title: "Journey Not Found | The Ubudian" };
    const j = journey as Journey;
    return {
      title: `${j.title} — Ubud Retreat`,
      description: j.summary || j.subtitle || undefined,
      openGraph: {
        title: j.title,
        description: j.summary || j.subtitle || undefined,
        // Images intentionally omitted — `opengraph-image.tsx` in this route
        // segment auto-generates a branded card and Next.js wires it in.
      },
      twitter: {
        card: "summary_large_image",
        title: j.title,
        description: j.summary || j.subtitle || undefined,
      },
    };
  } catch {
    return { title: "Journey Not Found | The Ubudian" };
  }
}

export default async function JourneyPage({ params }: JourneyPageProps) {
  let journey: Journey;
  let days: JourneyDay[] = [];
  const slotsByDay = new Map<string, JourneyDaySlot[]>();
  let candidatesBySlot = new Map<string, JourneyAtom[]>();
  const eventSlugs = new Map<string, string>();
  let moreJourneys: Journey[] = [];
  let testimonials: JourneyTestimonial[] = [];
  let initialSaved = false;
  const profile = await getCurrentProfile();

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: journeyRow } = await supabase
      .from("journeys")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!journeyRow) notFound();
    journey = journeyRow as Journey;

    if (profile) {
      const { data: savedRow } = await supabase
        .from("saved_journeys")
        .select("journey_id")
        .eq("profile_id", profile.id)
        .eq("journey_id", journey.id)
        .maybeSingle();
      initialSaved = Boolean(savedRow);
    }

    const [daysRes, moreRes, testRes, quizRes] = await Promise.all([
      supabase
        .from("journey_days")
        .select("*")
        .eq("journey_id", journey.id)
        .order("day_number", { ascending: true }),
      // Fetch all candidate alternates; we rank in JS so logged-in users with a
      // quiz result see archetype-matched threads first instead of admin sort.
      supabase
        .from("journeys")
        .select("*")
        .eq("is_published", true)
        .eq("tier", "living_guide")
        .neq("id", journey.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("journey_testimonials")
        .select("*")
        .eq("journey_id", journey.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
      profile
        ? supabase
            .from("quiz_results")
            .select("primary_archetype, secondary_archetype")
            .eq("profile_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    days = (daysRes.data ?? []) as JourneyDay[];
    const allMore = (moreRes.data ?? []) as Journey[];
    const quiz = quizRes.data as { primary_archetype: ArchetypeId; secondary_archetype: ArchetypeId | null } | null;
    moreJourneys = rankJourneysByArchetype(allMore, {
      primary: quiz?.primary_archetype ?? null,
      secondary: quiz?.secondary_archetype ?? null,
    }).slice(0, 3);
    testimonials = (testRes.data ?? []) as JourneyTestimonial[];

    if (days.length > 0) {
      const { data: slots } = await supabase
        .from("journey_day_slots")
        .select("*")
        .in("journey_day_id", days.map((d) => d.id))
        .order("slot_window", { ascending: true })
        .order("position", { ascending: true });

      const allSlots = (slots ?? []) as JourneyDaySlot[];
      for (const d of days) {
        slotsByDay.set(d.id, allSlots.filter((s) => s.journey_day_id === d.id));
      }
      candidatesBySlot = await resolveDayCandidates(allSlots);

      // If the user has a quiz result, re-rank the candidates inside each
      // slot so archetype-aligned atoms surface first. Anon users see the
      // slot-resolver's theme-tag-based order unchanged.
      if (quiz?.primary_archetype) {
        for (const [slotId, atoms] of candidatesBySlot.entries()) {
          candidatesBySlot.set(
            slotId,
            rankAtomsForUser(atoms, {
              primary: quiz.primary_archetype,
              secondary: quiz.secondary_archetype ?? null,
            }),
          );
        }
      }

      // Fetch event slugs for any event_ref atoms (events route uses slug, not id)
      const eventIds = new Set<string>();
      for (const cs of candidatesBySlot.values()) {
        for (const a of cs) if (a.kind === "event_ref" && a.event_id) eventIds.add(a.event_id);
      }
      if (eventIds.size > 0) {
        const { data: evRows } = await supabase
          .from("events")
          .select("id, slug")
          .in("id", Array.from(eventIds));
        for (const r of (evRows ?? []) as { id: string; slug: string }[]) {
          eventSlugs.set(r.id, r.slug);
        }
      }
    }
  } catch {
    notFound();
  }

  const journeyUrl = `${SITE_URL}/experiences/${journey.slug}`;

  // Roll up signals from atoms across every slot — drives the practitioner
  // rail, the map, and (later) personalisation. Done once, used many times.
  const practitionerIds = new Set<string>();
  const mappableAtoms: JourneyAtom[] = [];
  const seenAtomIds = new Set<string>();
  for (const cs of candidatesBySlot.values()) {
    for (const atom of cs) {
      if (seenAtomIds.has(atom.id)) continue;
      seenAtomIds.add(atom.id);
      if (atom.practitioner_id) practitionerIds.add(atom.practitioner_id);
      if (
        typeof atom.latitude === "number" &&
        typeof atom.longitude === "number" &&
        Number.isFinite(atom.latitude) &&
        Number.isFinite(atom.longitude)
      ) {
        mappableAtoms.push(atom);
      }
    }
  }

  return (
    <article>
      <JourneyJsonLd journey={journey} />
      {/* Cover — slow Ken Burns drift on supporting browsers, static elsewhere */}
      {journey.cover_image_url ? (
        <div className="relative h-[440px] w-full overflow-hidden sm:h-[560px]">
          <div className="absolute inset-0 motion-safe:animate-[ambient-drift_22s_ease-in-out_infinite_alternate]">
            <Image
              src={journey.cover_image_url}
              alt={journey.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
          {profile && (
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
              <SaveJourneyButton
                journeyId={journey.id}
                profileId={profile.id}
                initialSaved={initialSaved}
              />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <div className="mx-auto max-w-3xl text-white">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] opacity-90">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {journey.length_days} {journey.length_days === 1 ? "day" : "days"}
                </span>
                <span>·</span>
                <span>Ubud Retreat</span>
              </div>
              <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
                {journey.title}
              </h1>
              {journey.subtitle && (
                <p className="mt-2 max-w-2xl text-base opacity-90 sm:text-lg">
                  {journey.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}

      {/* Practitioners rail */}
      <JourneyGuides practitionerIds={Array.from(practitionerIds)} />

      {/* Breadcrumbs */}
      <nav className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/experiences">Ubud Retreats</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{journey.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Archetype tags */}
        {journey.archetype_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {journey.archetype_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Hero quote — typographic moment, not just a quote box */}
        {journey.hero_quote && (
          <figure className="mt-10">
            <span
              aria-hidden="true"
              className="block font-serif text-5xl leading-none text-brand-gold/45 sm:text-6xl"
            >
              &ldquo;
            </span>
            <blockquote className="mt-2 font-serif text-xl italic leading-snug text-brand-deep-green sm:text-2xl">
              {journey.hero_quote}
            </blockquote>
            <div className="mt-5 h-px w-12 bg-brand-gold/40" />
          </figure>
        )}

        {/* Curator's note — Benji's voice, after the hero quote */}
        {journey.curator_note && (
          <aside className="mt-8 rounded-md border-l-2 border-brand-gold/60 bg-brand-cream/40 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-brand-gold">
              Curator&apos;s note
            </p>
            <p className="mt-2 font-serif text-base leading-relaxed text-brand-deep-green/90 sm:text-lg">
              {journey.curator_note}
            </p>
          </aside>
        )}

        {journey.summary && (
          <div className="mt-8 text-lg leading-relaxed text-foreground/75">
            <MarkdownContent content={journey.summary} />
          </div>
        )}

        {/* Last refreshed — quiet trust signal that this retreat is maintained */}
        <p className="mt-6 text-[11px] uppercase tracking-wider text-muted-foreground/70">
          Last refreshed{" "}
          {new Date(journey.updated_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>

        {/* Cohort facts — who, when, where, how many, what cost */}
        <CohortFacts journey={journey} applyHref={`/experiences/${journey.slug}/apply`} />

        {/* What this retreat holds — icon row */}
        <section className="mt-12">
          <h2 className="mb-5 font-serif text-xl font-medium text-brand-deep-green">
            What this retreat holds
          </h2>
          <WhatsIncludedIcons variant="card" />
        </section>
      </div>

      {/* Differentiator — typographic moment between summary and the day-by-day */}
      <DifferentiatorStrip />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">


        {/* What's included — narrative (kept where author has written it) */}
        {journey.whats_included && (
          <section className="mt-10 rounded-md border border-brand-gold/20 bg-brand-cream/40 p-6">
            <div className="text-base">
              <MarkdownContent content={journey.whats_included} />
            </div>
          </section>
        )}
      </div>

      {/* Days */}
      {days.length > 0 && (
        <>
          <JourneyDayTabs
            days={days.map((d) => ({ day_number: d.day_number, theme: d.theme }))}
          />
          <section className="border-t bg-brand-cream/30 px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
                The {journey.length_days} days
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The retreat is light by design — most days hold one good thing,
                with rest, food, and unplanned encounters around it.
              </p>
              <div className="mt-8 space-y-6">
                {days.map((d) => (
                  <JourneyDayCard
                    key={d.id}
                    day={d}
                    slots={slotsByDay.get(d.id) ?? []}
                    candidatesBySlot={candidatesBySlot}
                    eventSlugs={eventSlugs}
                    journeyTitle={journey.title}
                    journeyUrl={journeyUrl}
                  />
                ))}
              </div>
            </div>
          </section>
          <JourneyMap atoms={mappableAtoms} />
        </>
      )}

      {/* Testimonials */}
      <JourneyTestimonials testimonials={testimonials} journeyTitle={journey.title} />

      {/* FAQ */}
      <JourneyFaq journey={journey} />

      {/* Who it's for */}
      {journey.who_its_for && (
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
            Who this is for
          </h2>
          <div className="mt-4">
            <MarkdownContent content={journey.who_its_for} />
          </div>
        </section>
      )}

      {/* Practical info */}
      {journey.practical_info && (
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
            Practical
          </h2>
          <div className="mt-4">
            <MarkdownContent content={journey.practical_info} />
          </div>
        </section>
      )}

      {/* Share */}
      <div className="mx-auto max-w-3xl border-t px-4 py-8 sm:px-6">
        <ShareButtons
          title={journey.title}
          url={journeyUrl}
          text={journey.subtitle ?? journey.summary?.split("\n")[0] ?? undefined}
        />
      </div>

      {/* Newsletter CTA */}
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Want more retreats like this?
          </h2>
          <p className="mt-2 text-muted-foreground">
            One email a week with new threads, the events that matter this week,
            and the rituals quietly shaping Ubud&apos;s conscious community.
          </p>
          <NewsletterSignup className="mx-auto mt-6 max-w-md" />
        </div>
      </section>

      {/* More journeys */}
      {moreJourneys.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
            More threads to follow
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {moreJourneys.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        </section>
      )}

      {/* Quiz CTA */}
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Not sure if this one fits?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Take the quiz — we&apos;ll point you to the retreat that lines up with
            where you&apos;re standing.
          </p>
          <Link
            href="/quiz"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-gold px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-gold-light"
          >
            Take the Quiz
          </Link>
        </div>
      </section>
    </article>
  );
}
