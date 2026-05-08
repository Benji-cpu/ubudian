import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { getCurrentProfile } from "@/lib/auth";
import { ARCHETYPES } from "@/lib/quiz-data";
import { AgendaFeed } from "@/components/events/agenda-feed";
import { PriceFilteredEvents } from "@/components/events/price-filtered-events";
import { ViewSwitcher } from "@/components/events/view-switcher";
import { EventSortSelect } from "@/components/events/event-sort-select";
import { EventFilters } from "@/components/events/event-filters";
import { EventSearch } from "@/components/events/event-search";
import { CategoryGuideLink } from "@/components/events/category-guide-link";
import { MapView } from "@/components/events/map-view";
import { EventsHero } from "@/components/events/events-hero";
import { RefreshOnFocus } from "@/components/events/refresh-on-focus";
import { CrossSectionRibbon } from "@/components/journeys/cross-section-ribbon";
import { nowInBali } from "@/lib/events/bali-time";
import type { ArchetypeId, Event, Experience, QuizResultRecord } from "@/types";

export const metadata: Metadata = {
  title: "Events in Ubud",
  description:
    "Tantra workshops, sound journeys, breathwork, ecstatic dance, medicine song circles, and sacred ceremonies happening in Ubud this week.",
};

const ARCHETYPE_NAMES: Record<string, string> = {
  seeker: "The Seeker",
  explorer: "The Explorer",
  creative: "The Creative",
  connector: "The Connector",
  epicurean: "The Epicurean",
};

interface EventsPageProps {
  searchParams: Promise<{
    view?: string;
    category?: string;
    from?: string;
    to?: string;
    q?: string;
    month?: string;
    week?: string;
    time?: string;
    sort?: string;
    venue?: string;
    happening?: string;
    price?: string;
    archetype?: string;
    free?: string;
    intents?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const view = params.view || "feed";

  let allEvents: Event[] = [];
  let categoryGuide: Experience | null = null;
  let currentProfileId: string | null = null;
  let savedEventIds: string[] = [];
  let viewerArchetypes: ArchetypeId[] | null = null;
  let archetypeLabel: string | null = null;

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile();
    if (profile) {
      currentProfileId = profile.id;

      const [savedResult, quizResult] = await Promise.all([
        supabase.from("saved_events").select("event_id").eq("profile_id", profile.id),
        supabase
          .from("quiz_results")
          .select("primary_archetype, secondary_archetype")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      savedEventIds = ((savedResult.data ?? []) as { event_id: string }[]).map(
        (r) => r.event_id
      );

      const quiz = quizResult.data as Pick<
        QuizResultRecord,
        "primary_archetype" | "secondary_archetype"
      > | null;
      if (quiz?.primary_archetype) {
        viewerArchetypes = [
          quiz.primary_archetype,
          ...(quiz.secondary_archetype ? [quiz.secondary_archetype] : []),
        ];
        archetypeLabel = ARCHETYPES[quiz.primary_archetype]?.name ?? null;
      }
    }

    // Fetch matching guide for the active category
    if (params.category) {
      const { data: guide } = await supabase
        .from("experiences")
        .select("*")
        .eq("category", params.category)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .single();
      categoryGuide = (guide as Experience) ?? null;
    }

    const { data: events, error } = await queryWithRetry(() => {
      const sortByNewest = params.sort === "newest";
      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .order(sortByNewest ? "created_at" : "start_date", {
          ascending: !sortByNewest,
        });
      if (!sortByNewest) {
        query = query.order("start_time", { ascending: true, nullsFirst: false });
      }

      const today = nowInBali().dateStr;

      // Happening Now filter
      if (params.happening === "true") {
        query = query
          .lte("start_date", today)
          .or(`end_date.gte.${today},end_date.is.null`);
      } else if (view === "list" || view === "grid" || view === "feed") {
        // Feed/list/grid: future events, recurring past-start (rolled forward
        // by the bucket logic), AND multi-day events still in their span
        // (so day-3-of-5 retreats land in the in_progress bucket instead of
        // being filtered out by the start_date floor).
        query = query.or(
          `start_date.gte.${today},is_recurring.eq.true,end_date.gte.${today}`
        );
      }

      if (params.category) {
        query = query.eq("category", params.category);
      }

      if (params.from && params.happening !== "true") {
        query = query.gte("start_date", params.from);
      }
      if (params.to && params.happening !== "true") {
        query = query.lte("start_date", params.to);
      }

      if (params.q) {
        const q = `%${params.q}%`;
        query = query.or(
          `title.ilike.${q},short_description.ilike.${q},venue_name.ilike.${q},category.ilike.${q}`
        );
      }

      if (params.time === "morning") {
        query = query.or("start_time.is.null,start_time.lt.12:00:00");
      } else if (params.time === "afternoon") {
        query = query.or(
          "start_time.is.null,and(start_time.gte.12:00:00,start_time.lt.17:00:00)"
        );
      } else if (params.time === "evening") {
        query = query.or("start_time.is.null,start_time.gte.17:00:00");
      }

      if (params.venue) {
        query = query.ilike("venue_name", `%${params.venue}%`);
      }

      if (params.archetype) {
        query = query.contains("archetype_tags", [params.archetype]);
      }

      if (params.intents) {
        // Comma-separated intent ids — match events that carry at least one.
        const intents = params.intents
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (intents.length > 0) {
          query = query.overlaps("intent_tags", intents);
        }
      }

      return query;
    }, "events-list");
    if (error) console.error("Events query error:", error);
    allEvents = (events ?? []) as Event[];
  } catch {
    // Supabase unreachable — render with empty state
  }

  const isFeedView = view === "feed";
  const isMapView = view === "map";

  // The hero stands on its own with the gradient + painterly radials.
  // We can re-enable a curated photo backdrop once the AI image backfill
  // produces text-free, on-brand imagery — too many ingested cover URLs
  // are event flyers with embedded text that clashes with the headline.

  return (
    <div>
      <RefreshOnFocus />

      <EventsHero
        backdropImageUrl={null}
        backdropAlt=""
        backdropCaption={null}
        totalCount={allEvents.length}
      />

      <CrossSectionRibbon
        pitch="Don't want to plan it day-by-day? We've curated multi-day retreats."
        cta="See the curated retreats"
      />

      {/* Controls */}
      <section
        id="events"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Suspense>
            <EventSearch />
          </Suspense>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            {!isFeedView && !isMapView && (
              <Suspense>
                <EventSortSelect />
              </Suspense>
            )}
            <Suspense>
              <ViewSwitcher />
            </Suspense>
          </div>
        </div>

        <div className="mt-5">
          <Suspense>
            <EventFilters />
          </Suspense>
          {params.category && categoryGuide && (
            <CategoryGuideLink category={params.category} guide={categoryGuide} />
          )}
        </div>

        {params.archetype && ARCHETYPE_NAMES[params.archetype] && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-4 py-3">
            <p className="text-sm text-brand-charcoal">
              Showing events matched to your archetype:{" "}
              <span className="font-semibold text-brand-deep-green">
                {ARCHETYPE_NAMES[params.archetype]}
              </span>
            </p>
            <Link
              href="/events"
              className="text-sm font-medium text-brand-deep-green underline underline-offset-2 hover:text-brand-gold"
            >
              Show all events
            </Link>
          </div>
        )}
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {isFeedView ? (
          <Suspense>
            <AgendaFeed
              events={allEvents}
              currentProfileId={currentProfileId}
              savedEventIds={savedEventIds}
              viewerArchetypes={viewerArchetypes}
              archetypeLabel={archetypeLabel}
            />
          </Suspense>
        ) : isMapView ? (
          <MapView events={allEvents} />
        ) : (
          <Suspense>
            <PriceFilteredEvents
              events={allEvents}
              view={view}
              currentProfileId={currentProfileId}
              savedEventIds={savedEventIds}
            />
          </Suspense>
        )}
      </section>
    </div>
  );
}
