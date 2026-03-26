import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { Button } from "@/components/ui/button";
import { EventList } from "@/components/events/event-list";
import { EventGridView } from "@/components/events/event-grid-view";
import { EventCalendar } from "@/components/events/event-calendar";
import { EventWeekView } from "@/components/events/event-week-view";
import { ViewSwitcher } from "@/components/events/view-switcher";
import { EventFilters } from "@/components/events/event-filters";
import { EventSearch } from "@/components/events/event-search";
import type { Event } from "@/types";

export const metadata: Metadata = {
  title: "Events in Ubud | The Ubudian",
  description:
    "Tantra workshops, sound journeys, breathwork, ecstatic dance, medicine song circles, and sacred ceremonies happening in Ubud this week.",
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
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const view = params.view || "list";

  let allEvents: Event[] = [];

  try {
    const supabase = await createClient();

    const { data: events, error } = await queryWithRetry(() => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .order("start_date", { ascending: true });

      // Only show future events in list/grid view (but include recurring events with past start dates)
      if (view === "list" || view === "grid") {
        const today = new Date().toISOString().split("T")[0];
        query = query.or(`start_date.gte.${today},is_recurring.eq.true`);
      }

      if (params.category) {
        query = query.eq("category", params.category);
      }

      if (params.from) {
        query = query.gte("start_date", params.from);
      }

      if (params.to) {
        query = query.lte("start_date", params.to);
      }

      if (params.q) {
        const q = `%${params.q}%`;
        query = query.or(`title.ilike.${q},short_description.ilike.${q},venue_name.ilike.${q},category.ilike.${q}`);
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
          <Suspense>
            <ViewSwitcher />
          </Suspense>
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
        </div>

        <div className="mt-8">
          <Suspense>
            {view === "calendar" ? (
              <EventCalendar events={allEvents} />
            ) : view === "week" ? (
              <EventWeekView events={allEvents} />
            ) : view === "grid" ? (
              <EventGridView events={allEvents} />
            ) : (
              <EventList events={allEvents} />
            )}
          </Suspense>
        </div>
      </section>
    </div>
  );
}
