import { SaveEventButton } from "@/components/dashboard/save-event-button";
import { CollapsibleSection } from "./collapsible-section";
import { TimeSection } from "./time-section";
import { bucketEventsByTime, type EventBucket } from "@/lib/events/buckets";
import type { Event } from "@/types";

interface MoreHappeningsProps {
  events: Event[];
  currentProfileId: string | null;
  savedEventIds: string[];
  boostedEventIds?: Set<string>;
}

// Same time windows as the core agenda, reworded slightly so the discovery
// section reads as "what's worth catching" rather than a duplicate agenda.
const DISCOVERY_BUCKET_ORDER: {
  key: EventBucket;
  label: string;
  subtitle?: string;
}[] = [
  { key: "happening_now", label: "On now" },
  { key: "today", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow" },
  {
    key: "in_progress",
    label: "Running now",
    subtitle: "On for a few days — catch them before they close",
  },
  { key: "weekend", label: "This weekend" },
  { key: "next_week", label: "Next week" },
  { key: "later", label: "On the horizon" },
];

/**
 * The "More happenings in Ubud" discovery tier — festivals, gallery openings,
 * markets, food and performance, gated below the conscious-community core feed
 * in a collapsed-by-default section so it never floods the primary agenda.
 */
export function MoreHappenings({
  events,
  currentProfileId,
  savedEventIds,
  boostedEventIds,
}: MoreHappeningsProps) {
  if (!events.length) return null;

  const now = new Date();
  const savedSet = new Set(savedEventIds);
  const buckets = bucketEventsByTime(events, now, boostedEventIds);

  const renderSave = (event: Event) =>
    currentProfileId ? (
      <SaveEventButton
        eventId={event.id}
        profileId={currentProfileId}
        initialSaved={savedSet.has(event.id)}
      />
    ) : null;

  return (
    <CollapsibleSection
      title="More happenings in Ubud"
      subtitle="Festivals, gallery openings, markets, food & performance across the valley."
      count={events.length}
      storageKey="ubudian:more-happenings"
    >
      <div className="space-y-12 pt-8">
        {DISCOVERY_BUCKET_ORDER.map(({ key, label, subtitle }) => (
          <TimeSection
            key={key}
            label={label}
            subtitle={subtitle}
            events={buckets[key]}
            renderSaveButton={renderSave}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
