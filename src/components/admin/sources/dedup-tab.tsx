"use client";

import { DedupComparison } from "@/components/admin/ingestion/dedup-comparison";
import type { Event, DedupMatch } from "@/types";

interface DedupTabProps {
  matches: DedupMatch[];
  eventsMap: Record<string, Event>;
}

export function DedupTab({ matches, eventsMap }: DedupTabProps) {
  if (matches.length === 0) {
    return (
      <div className="mt-4 py-12 text-center text-muted-foreground">
        No duplicate matches to review. All clear!
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <p className="text-sm text-muted-foreground">
        {matches.length} pending match{matches.length !== 1 ? "es" : ""} to review.
      </p>
      {matches.map((match) => {
        const eventA = eventsMap[match.event_a_id];
        const eventB = eventsMap[match.event_b_id];

        if (!eventA || !eventB) return null;

        return (
          <DedupComparison
            key={match.id}
            match={match}
            eventA={eventA}
            eventB={eventB}
          />
        );
      })}
    </div>
  );
}
