import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { getCurrentProfile } from "@/lib/auth";
import { ARCHETYPES } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { AgendaFeed } from "@/components/events/agenda-feed";
import { PriceFilteredEvents } from "@/components/events/price-filtered-events";
import { ViewSwitcher } from "@/components/events/view-switcher";
import { EventSortSelect } from "@/components/events/event-sort-select";
import { EventFilters } from "@/components/events/event-filters";
import { EventSearch } from "@/components/events/event-search";
import { CategoryGuideLink } from "@/components/events/category-guide-link";
import { MapView } from "@/components/events/map-view";
import { RefreshOnFocus } from "@/components/events/refresh-on-focus";
import { nowInBali } from "@/lib/events/bali-time";
import type { ArchetypeId, Event, Experience, QuizResultRecord } from "@/types";

export const metadata: Metadata = {
  title: "Events in Ubud | The Ubudian",
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
    hasImage?: string;
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

      const today = nowInBali().dateStr;

      // Happening Now filter
      if (params.happening === "true") {
        query = query
          .lte("start_date", today)
          .or(`end_date.gte.${today},end_date.is.null`);
      } else if (view === "list" || view === "grid" || view === "feed") {
        // Feed/list/grid: only show future events (include recurring past-start)
        query = query.or(`start_date.gte.${today},is_recurring.eq.true`);
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

      return query;
    }, "events-list");
    if (error) console.error("Events query error:", error);
    allEvents = (events ?? []) as Event[];
  } catch {
    // Supabase unreachable — render with empty state
  }

  const isFeedView = view === "feed";
  const isMapView = view === "map";

  return (
    <div>
      <RefreshOnFocus />
      {/* Hero */}
      <section className="bg-brand-cream px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            What&apos;s Happening in Ubud
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tantra workshops, sound journeys, breathwork sessions, sacred
            circles, and community gatherings — updated daily from across Ubud.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/events/submit">Submit an Event</Link>
          </Button>
        </div>
      </section>

      {/* Controls */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <Suspense>
              <ViewSwitcher />
            </Suspense>
            {!isFeedView && !isMapView && (
              <Suspense>
                <EventSortSelect />
              </Suspense>
            )}
          </div>
          <div className="w-full sm:max-w-xs">
            <Suspense>
              <EventSearch />
            </Suspense>
          </div>
        </div>

        <div className="mt-4">
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
