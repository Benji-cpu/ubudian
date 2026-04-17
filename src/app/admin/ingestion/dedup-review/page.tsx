import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DedupComparison } from "@/components/admin/ingestion/dedup-comparison";
import { ArrowLeft } from "lucide-react";
import type { DedupMatch, Event } from "@/types";

export default async function DedupReviewPage() {
  const supabase = await createClient();

  // Fetch pending dedup matches
  const { data: matches } = await supabase
    .from("dedup_matches")
    .select("*")
    .eq("status", "pending")
    .order("confidence", { ascending: false })
    .limit(20);

  const allMatches = (matches ?? []) as DedupMatch[];

  // Collect all event IDs referenced in matches
  const eventIds = new Set<string>();
  for (const m of allMatches) {
    eventIds.add(m.event_a_id);
    eventIds.add(m.event_b_id);
  }

  // Fetch all referenced events
  const eventsMap: Record<string, Event> = {};
  if (eventIds.size > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .in("id", Array.from(eventIds));

    for (const e of (events ?? []) as Event[]) {
      eventsMap[e.id] = e;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/sources">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Dedup Review Queue</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {allMatches.length} pending match{allMatches.length !== 1 ? "es" : ""}
        </span>
      </div>

      {allMatches.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No duplicate matches to review. All clear!
        </div>
      ) : (
        <div className="space-y-6">
          {allMatches.map((match) => {
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
      )}
    </div>
  );
}
