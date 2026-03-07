"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Merge, Loader2 } from "lucide-react";
import type { Event, DedupMatch } from "@/types";

interface DedupComparisonProps {
  match: DedupMatch;
  eventA: Event;
  eventB: Event;
}

export function DedupComparison({ match, eventA, eventB }: DedupComparisonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function resolveMatch(resolution: "confirmed_dup" | "not_dup" | "merged") {
    setLoading(resolution);
    try {
      await fetch("/api/admin/ingestion/dedup/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, resolution }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to resolve match:", err);
    } finally {
      setLoading(null);
    }
  }

  const confidenceColor =
    match.confidence >= 0.8
      ? "text-red-600"
      : match.confidence >= 0.6
        ? "text-yellow-600"
        : "text-green-600";

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{match.match_type}</Badge>
          <span className={`text-sm font-medium ${confidenceColor}`}>
            {Math.round(match.confidence * 100)}% confidence
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resolveMatch("not_dup")}
            disabled={loading !== null}
          >
            {loading === "not_dup" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <X className="mr-1 h-3 w-3" />
            )}
            Not Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => resolveMatch("confirmed_dup")}
            disabled={loading !== null}
          >
            {loading === "confirmed_dup" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Check className="mr-1 h-3 w-3" />
            )}
            Confirm Duplicate
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EventCard event={eventA} label="Event A" />
        <EventCard event={eventB} label="Event B" />
      </div>
    </div>
  );
}

function EventCard({ event, label }: { event: Event; label: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{label}</span>
          <Badge variant={event.status === "approved" ? "default" : "secondary"}>
            {event.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="font-medium">{event.title}</p>
        <p className="text-muted-foreground">{event.start_date}</p>
        <p className="text-muted-foreground">{event.venue_name || "No venue"}</p>
        <p className="text-muted-foreground">{event.category}</p>
        {event.source_url && (
          <p className="truncate text-xs text-blue-600">
            <a href={event.source_url} target="_blank" rel="noopener noreferrer">
              {event.source_url}
            </a>
          </p>
        )}
        <p className="line-clamp-3 text-xs text-muted-foreground">
          {event.short_description || event.description?.slice(0, 150)}
        </p>
      </CardContent>
    </Card>
  );
}
