import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PriceFilteredEvents } from "@/components/events/price-filtered-events";
import { ViewSwitcher } from "@/components/events/view-switcher";
import { EventSortSelect } from "@/components/events/event-sort-select";
import { EventFilters } from "@/components/events/event-filters";
import { EventSearch } from "@/components/events/event-search";
import { CategoryGuideLink } from "@/components/events/category-guide-link";
import type { Event, Experience } from "@/types";

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
  const view = params.view || "list";

  let allEvents: Event[] = [];
  let categoryGuide: Experience | null = null;
  let currentProfileId: string | null = null;
  let savedEventIds: string[] = [];

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile();
    if (profile) {
      currentProfileId = profile.id;
      const { data: saved } = await supabase
        .from("saved_events")
        .select("event_id")
        .eq("profile_id", profile.id);
      savedEventIds = ((saved ?? []) as { event_id: string }[]).map((r) => r.event_id);
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
      // Sort order
      const sortByNewest = params.sort === "newest";
      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .order(sortByNewest ? "created_at" : "start_date", {
          ascending: !sortByNewest,
        });

      const today = new Date().toISOString().split("T")[0];

      // Happening Now filter
      if (params.happening === "true") {
        query = query
          .lte("start_date", today)
          .or(`end_date.gte.${today},end_date.is.null`);
      } else if (view === "list" || view === "grid") {
        // Only show future events in list/grid view (but include recurring events with past start dates)
        query = query.or(`start_date.gte.${today},is_recurring.eq.true`);
      }

      if (params.category) {
        query = query.eq("category", params.category);
      }

      // Date range filters (not used with "happening now")
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

      // Time of Day filter
      if (params.time === "morning") {
        query = query.or("start_time.is.null,start_time.lt.12:00:00");
      } else if (params.time === "afternoon") {
        query = query.or(
          "start_time.is.null,and(start_time.gte.12:00:00,start_time.lt.17:00:00)"
        );
      } else if (params.time === "evening") {
        query = query.or("start_time.is.null,start_time.gte.17:00:00");
      }

      // Venue search
      if (params.venue) {
        query = query.ilike("venue_name", `%${params.venue}%`);
      }

      // Archetype filter
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

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
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

      {/* Controls & Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <Suspense>
              <ViewSwitcher />
            </Suspense>
            <Suspense>
              <EventSortSelect />
            </Suspense>
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
            <CategoryGuideLink
              category={params.category}
              guide={categoryGuide}
            />
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

        <div className="mt-8">
          <Suspense>
            <PriceFilteredEvents
              events={allEvents}
              view={view}
              currentProfileId={currentProfileId}
              savedEventIds={savedEventIds}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
