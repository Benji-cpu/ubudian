import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import { getCurrentProfile } from "@/lib/auth";
import { ARCHETYPES } from "@/lib/quiz-data";
import { AgendaFeed } from "@/components/events/agenda-feed";
import { PriceFilteredEvents } from "@/components/events/price-filtered-events";
import { EventFilters } from "@/components/events/event-filters";
import { EventSearch } from "@/components/events/event-search";
import { CategoryGuideLink } from "@/components/events/category-guide-link";
import { MapView } from "@/components/events/map-view";
import { EventsHero } from "@/components/events/events-hero";
import { ArchetypeExplainer } from "@/components/quiz/archetype-explainer";
import { RefreshOnFocus } from "@/components/events/refresh-on-focus";
import { CrossSectionRibbon } from "@/components/journeys/cross-section-ribbon";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { eventIsHappeningNow, nowInBali } from "@/lib/events/bali-time";
import { filterEventsInRange } from "@/lib/events/filter-range";
import { getActiveBoostedEventIds, getCategorySponsor } from "@/lib/sponsors/sponsor-service";
import { PartnerCredit } from "@/components/sponsors/partner-credit";
import { splitByTier, pickSpotlight, bannerEyebrow } from "@/lib/events/discovery";
import { FestivalBanner } from "@/components/events/festival-banner";
import { MoreHappenings } from "@/components/events/more-happenings";
import type { ArchetypeId, Event, Experience, QuizResultRecord, Sponsor } from "@/types";

const VIEWS_USING_OWN_VIEWPORT = new Set(["calendar", "week"]);

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
    festivals?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const view = params.view || "list";

  let allEvents: Event[] = [];
  let categoryGuide: Experience | null = null;
  let currentProfileId: string | null = null;
  let savedEventIds: string[] = [];
  let viewerArchetypes: ArchetypeId[] | null = null;
  let archetypeLabel: string | null = null;
  let boostedEventIds: Set<string> = new Set();
  let categorySponsor: Sponsor | null = null;

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
      let query = supabase.from("events").select("*").eq("status", "approved");
      // For "newest" we can sort DB-side on created_at — recurring rolling
      // doesn't move the row's authored timestamp. For "date" (default) we
      // sort client-side after roll-forward; the DB's `start_date` column is
      // the seed date, which is misleading once we re-anchor to the next
      // occurrence.
      if (sortByNewest) {
        query = query.order("created_at", { ascending: false });
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

      // NOTE: `params.from` / `params.to` are intentionally NOT applied at the
      // DB layer. Recurring events store their seed `start_date`, so a DB-side
      // BETWEEN would strip every recurring class whose original date sits
      // outside the window — including weekly events whose next occurrence
      // lands squarely inside it. The range is applied in `filterEventsInRange`
      // below, after roll-forward, for views that share the page-level events
      // array (feed, list, grid, map). Calendar and Week views manage their
      // own viewport via `expandRecurrence`.

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

    // Community-partner data — boost-sort eligible event IDs and (when filtered
    // by category) the anchor sponsor that owns that category.
    boostedEventIds = await getActiveBoostedEventIds();
    if (params.category) {
      categorySponsor = await getCategorySponsor(params.category);
    }
  } catch {
    // Supabase unreachable — render with empty state
  }

  const isFeedView = view === "feed";
  const isMapView = view === "map";

  // Calendar and Week views walk their own date viewport and run
  // `expandRecurrence` themselves — they need the raw seed-date events. For
  // every other view, we roll recurring events forward to the next occurrence
  // inside the active `from`/`to` window (or to today, if no window is set)
  // before handing the array down.
  const useOwnViewport = VIEWS_USING_OWN_VIEWPORT.has(view);
  let viewEvents = useOwnViewport
    ? allEvents
    : filterEventsInRange(
        allEvents,
        params.from ?? null,
        params.to ?? null,
        undefined,
        boostedEventIds
      );

  // Happening-now narrows the page-level array to events the bucket layer
  // would actually put in the "Happening now" bucket. The DB pre-fetch is
  // permissive (it returns every event whose span overlaps today, including
  // recurring seeds from months back) so without this trim the hero count
  // could read "134 gatherings" while the agenda only renders ~20.
  if (params.happening === "true" && !useOwnViewport) {
    const baliNow = nowInBali();
    viewEvents = viewEvents.filter((event) => eventIsHappeningNow(event, baliNow));
  }

  // "Festivals" chip — special one-off events (festivals, launch parties,
  // gallery openings), NOT regular recurring classes. Applied client-side on
  // the rolled-forward array (same rationale as from/to) so recurring seeds
  // aren't stripped at the DB layer. All survivors are discovery/spotlight, so
  // splitByTier's empty-core fallback (primaryEvents = discovery) renders them.
  if (params.festivals === "true" && !useOwnViewport) {
    viewEvents = viewEvents.filter(
      (event) =>
        !event.is_recurring &&
        (event.event_tier === "discovery" || event.is_spotlight)
    );
  }

  // Two-tier split: the conscious-community CORE agenda renders first; the
  // broader DISCOVERY set (festivals, galleries, markets, food, performance)
  // lives in the collapsed "More happenings" section below. When a category
  // filter resolves entirely to discovery (e.g. ?category=Art%20%26%20Culture),
  // discovery becomes the primary feed so we never show an empty core agenda
  // above a hidden section. Calendar/Week views keep their full set untouched.
  const { core, discovery } = splitByTier(viewEvents);
  const primaryEvents = core.length ? core : discovery;
  const extraDiscovery = core.length ? discovery : [];
  const spotlight = useOwnViewport ? null : pickSpotlight(discovery);
  const heroCount = useOwnViewport ? viewEvents.length : primaryEvents.length;

  return (
    <div>
      <RefreshOnFocus />

      <EventsHero totalCount={heroCount} />

      {spotlight && (
        <div className="mt-2">
          <FestivalBanner
            href={`/events/${spotlight.slug}`}
            eyebrow={bannerEyebrow(spotlight)}
            title={spotlight.title}
            line={spotlight.short_description}
          />
        </div>
      )}

      {/* Controls — a single calm toolbar:
            1. Search (the strongest affordance)
            2. Dance / Tantra / Festivals chips + one "Filters" button
            Everything else (view, sort, dates, time, price, venue) lives
            inside the Filters sheet, hidden by default. */}
      <section
        id="events"
        className="mx-auto min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="flex min-w-0 flex-col gap-3">
          <Suspense>
            <EventSearch />
          </Suspense>
          <Suspense>
            <EventFilters resultCount={viewEvents.length} />
          </Suspense>
        </div>

        <div className="mt-4">
          {params.category && categorySponsor && (
            <PartnerCredit
              sponsor={categorySponsor}
              verb={`${params.category}, brought to you by`}
              className="mt-4"
            />
          )}
          {params.category && categoryGuide && (
            <CategoryGuideLink category={params.category} guide={categoryGuide} />
          )}
        </div>

        {params.archetype && ARCHETYPE_NAMES[params.archetype] && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-4 py-3">
            <p className="text-sm text-foreground">
              Showing events matched to your archetype:{" "}
              <span className="font-semibold text-brand-deep-green dark:text-brand-gold">
                {ARCHETYPE_NAMES[params.archetype]}
              </span>
            </p>
            <Link
              href="/events"
              className="text-sm font-medium text-brand-deep-green underline underline-offset-2 hover:text-brand-gold dark:text-brand-gold"
            >
              Show all events
            </Link>
          </div>
        )}
      </section>

      {/* Orientation — only for visitors who haven't taken the quiz and aren't
          already filtering by archetype. Once they have a spirit, the feed is
          personalised and this nudge would be noise. Kept slim so the agenda
          stays close to the fold. */}
      {!viewerArchetypes && !params.archetype && !useOwnViewport && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <ArchetypeExplainer variant="strip" />
        </section>
      )}

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {isFeedView ? (
          <>
            <Suspense>
              <AgendaFeed
                events={primaryEvents}
                currentProfileId={currentProfileId}
                savedEventIds={savedEventIds}
                viewerArchetypes={viewerArchetypes}
                archetypeLabel={archetypeLabel}
                boostedEventIds={boostedEventIds}
              />
            </Suspense>
            {extraDiscovery.length > 0 && (
              <div className="mt-14">
                <MoreHappenings
                  events={extraDiscovery}
                  currentProfileId={currentProfileId}
                  savedEventIds={savedEventIds}
                  boostedEventIds={boostedEventIds}
                />
              </div>
            )}
          </>
        ) : isMapView ? (
          <MapView events={primaryEvents} />
        ) : (
          <>
            <Suspense>
              <PriceFilteredEvents
                events={useOwnViewport ? allEvents : primaryEvents}
                view={view}
                currentProfileId={currentProfileId}
                savedEventIds={savedEventIds}
              />
            </Suspense>
            {!useOwnViewport && extraDiscovery.length > 0 && (
              <div className="mt-14">
                <MoreHappenings
                  events={extraDiscovery}
                  currentProfileId={currentProfileId}
                  savedEventIds={savedEventIds}
                  boostedEventIds={boostedEventIds}
                />
              </div>
            )}
          </>
        )}
      </section>

      <CrossSectionRibbon
        pitch="Don't want to plan it day-by-day? We've curated multi-day retreats."
        cta="See the curated retreats"
      />

      {/* Newsletter capture. The agenda is the highest-intent surface on the
          site — a visitor who scrolled the week is the likeliest to want it
          delivered. Literal hex for BOTH the green band and the cream text —
          --brand-deep-green / --brand-cream are foreground tokens that invert
          in dark mode, so `bg-brand-deep-green` would render light-sage at
          night. Lock the band the same way the events/home heroes are locked. */}
      <section className="border-t border-brand-gold/15 bg-[#2C4A3E]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <p className="font-serif text-2xl text-[#FAF5EC] sm:text-3xl">
            Never miss the good ones.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#FAF5EC]/70">
            One email a week — the ceremonies, dance floors, and circles worth
            clearing an evening for, before they fill up.
          </p>
          <NewsletterSignup
            variant="dark"
            className="mx-auto mt-6 max-w-md text-left"
          />
        </div>
      </section>
    </div>
  );
}
