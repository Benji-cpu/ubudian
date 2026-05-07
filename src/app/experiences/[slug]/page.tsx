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
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { resolveDayCandidates } from "@/lib/journeys/slot-resolver";
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
  Journey,
  JourneyDay,
  JourneyDaySlot,
  JourneyAtom,
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
      title: `${j.title} — Ubud Journey`,
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

    const [daysRes, moreRes] = await Promise.all([
      supabase
        .from("journey_days")
        .select("*")
        .eq("journey_id", journey.id)
        .order("day_number", { ascending: true }),
      supabase
        .from("journeys")
        .select("*")
        .eq("is_published", true)
        .eq("tier", "living_guide")
        .neq("id", journey.id)
        .order("sort_order", { ascending: true })
        .limit(3),
    ]);

    days = (daysRes.data ?? []) as JourneyDay[];
    moreJourneys = (moreRes.data ?? []) as Journey[];

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

  return (
    <article>
      <JourneyJsonLd journey={journey} />
      {/* Cover */}
      {journey.cover_image_url ? (
        <div className="relative h-[420px] w-full sm:h-[520px]">
          <Image
            src={journey.cover_image_url}
            alt={journey.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <div className="mx-auto max-w-3xl text-white">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] opacity-90">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {journey.length_days} {journey.length_days === 1 ? "day" : "days"}
                </span>
                <span>·</span>
                <span>Living Guide</span>
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

      {/* Breadcrumbs */}
      <nav className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/experiences">Experiences</BreadcrumbLink>
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

        {/* Hero quote / summary */}
        {journey.hero_quote && (
          <blockquote className="mt-6 border-l-2 border-brand-gold/50 pl-4 font-serif text-xl italic text-brand-deep-green">
            {journey.hero_quote}
          </blockquote>
        )}
        {journey.summary && (
          <div className="mt-6 text-lg leading-relaxed text-muted-foreground">
            <MarkdownContent content={journey.summary} />
          </div>
        )}

        {/* What's included */}
        {journey.whats_included && (
          <section className="mt-12 rounded-md border border-brand-gold/20 bg-brand-cream/40 p-6">
            <h2 className="font-serif text-xl font-medium text-brand-deep-green">
              What this journey holds
            </h2>
            <div className="mt-4 text-base">
              <MarkdownContent content={journey.whats_included} />
            </div>
          </section>
        )}
      </div>

      {/* Days */}
      {days.length > 0 && (
        <section className="border-t bg-brand-cream/30 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-2xl font-medium text-brand-deep-green">
              The {journey.length_days} days
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The journey is light by design — most days hold one good thing,
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
                />
              ))}
            </div>
          </div>
        </section>
      )}

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
            Want more journeys like this?
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
            Take the quiz — we&apos;ll point you to the journey that lines up with
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
