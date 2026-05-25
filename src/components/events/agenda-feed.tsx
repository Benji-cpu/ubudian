import { SaveEventButton } from "@/components/dashboard/save-event-button";
import { HeroEvent } from "./hero-event";
import { ForYouRail } from "./for-you-rail";
import { TimeSection } from "./time-section";
import { rankEvents } from "@/lib/events/ranking";
import type { ArchetypeId, Event } from "@/types";
import { bucketEventsByTime, type EventBucket } from "@/lib/events/buckets";

interface AgendaFeedProps {
  events: Event[];
  currentProfileId: string | null;
  savedEventIds: string[];
  viewerArchetypes?: ArchetypeId[] | null;
  archetypeLabel?: string | null;
  /** Event IDs with an active Partner+ sponsorship — boost in ranking + buckets. */
  boostedEventIds?: Set<string>;
}

const BUCKET_ORDER: { key: EventBucket; label: string; subtitle?: string }[] = [
  { key: "happening_now", label: "Happening now", subtitle: "Drop in if you're nearby" },
  { key: "today", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "in_progress", label: "Running this week", subtitle: "Multi-day workshops you can join mid-flow" },
  { key: "weekend", label: "This weekend" },
  { key: "next_week", label: "Next week" },
  { key: "later", label: "Later this month and beyond" },
];

export function AgendaFeed({
  events,
  currentProfileId,
  savedEventIds,
  viewerArchetypes,
  archetypeLabel,
  boostedEventIds,
}: AgendaFeedProps) {
  const now = new Date();
  const savedSet = new Set(savedEventIds);

  const renderSave = (event: Event) =>
    currentProfileId ? (
      <SaveEventButton
        eventId={event.id}
        profileId={currentProfileId}
        initialSaved={savedSet.has(event.id)}
      />
    ) : null;

  if (!events.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-brand-gold/30 bg-brand-cream/40 px-6 py-12 text-center">
        <h3 className="font-serif text-xl text-brand-deep-green">
          Nothing scheduled right now
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Check back soon — new events appear daily as our community shares them.
        </p>
      </div>
    );
  }

  // Rank everything once to pick the hero + populate For You.
  const ranked = rankEvents(events, {
    now,
    viewerArchetypes: viewerArchetypes ?? undefined,
    boostedEventIds,
  });

  // Bucket the full set first so the hero is anchored to *today*, not just
  // whatever ranks highest. Surfacing a Jun-29 event under a "Featured today"
  // badge on a quiet Tuesday reads as a lie. Walk buckets nearest-to-furthest
  // and pick the top-ranked event within the first non-empty bucket.
  const heroBuckets = bucketEventsByTime(events, now, boostedEventIds);
  const HERO_PRIORITY: { key: EventBucket; label: string }[] = [
    { key: "happening_now", label: "Happening now" },
    { key: "today", label: "Featured today" },
    { key: "in_progress", label: "Running this week" },
    { key: "tomorrow", label: "Featured tomorrow" },
    { key: "weekend", label: "Featured this weekend" },
    { key: "next_week", label: "Featured this week" },
    { key: "later", label: "Coming up" },
  ];
  let hero: Event | undefined;
  let heroLabel = "Featured today";
  for (const { key, label } of HERO_PRIORITY) {
    if (heroBuckets[key].length === 0) continue;
    const bucketIds = new Set(heroBuckets[key].map((e) => e.id));
    const topInBucket = ranked.find((r) => bucketIds.has(r.event.id));
    if (topInBucket) {
      // Use the bucket's rolled-forward copy so the date matches the badge.
      hero = heroBuckets[key].find((e) => e.id === topInBucket.event.id) ?? topInBucket.event;
      heroLabel = label;
      break;
    }
  }

  // For You rail — only when we have honest signal from the viewer.
  // Signed-out users see no rail (the page doesn't claim to know them);
  // signed-in users get the rail iff they've taken the quiz OR saved at
  // least one event. Picking from archetype overlap when we have it,
  // otherwise weighted by category overlap with what they've saved.
  const hasArchetype = (viewerArchetypes?.length ?? 0) > 0;
  const hasSaves = savedEventIds.length > 0;
  const hasSignal = !!currentProfileId && (hasArchetype || hasSaves);

  const savedCategories = new Set<string>();
  if (hasSaves) {
    for (const e of events) {
      if (savedSet.has(e.id)) savedCategories.add(e.category);
    }
  }

  const forYouCandidates: Event[] = hasSignal
    ? ranked
        .filter((r) => r.event.id !== hero?.id && !savedSet.has(r.event.id))
        .filter((r) => {
          if (hasArchetype && r.components.personalization > 0) return true;
          if (hasSaves && savedCategories.has(r.event.category)) return true;
          return false;
        })
        .slice(0, 8)
        .map((r) => r.event)
    : [];

  // Bucket the remainder (everything except the hero) into time sections.
  const remainder = events.filter((e) => e.id !== hero?.id);
  const buckets = bucketEventsByTime(remainder, now, boostedEventIds);

  return (
    <div className="space-y-12">
      {hero && <HeroEvent event={hero} label={heroLabel} saveButton={renderSave(hero)} />}

      {hasSignal && forYouCandidates.length > 0 && (
        <ForYouRail
          events={forYouCandidates}
          archetypeLabel={archetypeLabel ?? null}
          savedCount={savedEventIds.length}
        />
      )}

      {BUCKET_ORDER.map(({ key, label, subtitle }) => (
        <TimeSection
          key={key}
          label={label}
          subtitle={subtitle}
          events={buckets[key]}
          renderSaveButton={renderSave}
        />
      ))}
    </div>
  );
}
