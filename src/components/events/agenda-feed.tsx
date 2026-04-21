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
}

const BUCKET_ORDER: { key: EventBucket; label: string; subtitle?: string }[] = [
  { key: "happening_now", label: "Happening now", subtitle: "Drop in if you're nearby" },
  { key: "today", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow" },
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
  });

  // Hero: top-ranked event that has not yet finished.
  const hero = ranked[0]?.event;

  // For You rail: prefer archetype-matched events. Fallback to top-ranked
  // minus the hero. Cap at 8 so the rail stays snappy on mobile.
  const forYouCandidates = viewerArchetypes?.length
    ? ranked
        .filter((r) => r.components.personalization > 0 && r.event.id !== hero?.id)
        .slice(0, 8)
        .map((r) => r.event)
    : ranked
        .filter((r) => r.event.id !== hero?.id)
        .slice(0, 8)
        .map((r) => r.event);

  // Bucket the remainder (everything except the hero) into time sections.
  const remainder = events.filter((e) => e.id !== hero?.id);
  const buckets = bucketEventsByTime(remainder, now);

  return (
    <div className="space-y-12">
      {hero && <HeroEvent event={hero} saveButton={renderSave(hero)} />}

      {forYouCandidates.length > 0 && (
        <ForYouRail
          events={forYouCandidates}
          archetypeLabel={archetypeLabel ?? null}
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
