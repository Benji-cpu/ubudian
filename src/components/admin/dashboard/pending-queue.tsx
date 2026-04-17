"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, X, Sparkles, ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PendingEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  venue_name: string | null;
  start_date: string;
  status: string;
  source_id: string | null;
  llm_parsed: boolean;
  created_at: string;
  event_sources: { name: string; source_type: string } | null;
}

interface PendingQueueProps {
  events: PendingEvent[];
}

function getSourceEmoji(sourceType: string | undefined): string {
  switch (sourceType) {
    case "telegram":
      return "TG";
    case "whatsapp":
      return "WA";
    case "scraper":
    case "api":
      return "MX";
    default:
      return "??";
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    yoga: "bg-green-100 text-green-700 border-green-200",
    dance: "bg-pink-100 text-pink-700 border-pink-200",
    music: "bg-purple-100 text-purple-700 border-purple-200",
    wellness: "bg-teal-100 text-teal-700 border-teal-200",
    food: "bg-orange-100 text-orange-700 border-orange-200",
    art: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ceremony: "bg-amber-100 text-amber-700 border-amber-200",
    community: "bg-blue-100 text-blue-700 border-blue-200",
    workshop: "bg-cyan-100 text-cyan-700 border-cyan-200",
    market: "bg-lime-100 text-lime-700 border-lime-200",
  };
  return colors[category.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200";
}

export function PendingQueue({ events }: PendingQueueProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(eventId: string, action: "approve" | "reject") {
    setLoadingId(eventId);
    try {
      const res = await fetch("/api/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, action }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to process event:", error);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4" />
            Pending Review
          </CardTitle>
          {events.length > 0 && (
            <Link
              href="/admin/events?status=pending"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <p className="mt-3 text-sm font-medium">All caught up!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No pending events to review.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 8).map((event) => {
              const isLoading = loadingId === event.id;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-opacity",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  {/* Title & Source */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="font-medium hover:underline truncate block"
                    >
                      {event.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {event.event_sources && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {getSourceEmoji(event.event_sources.source_type)}{" "}
                          {event.event_sources.name}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 capitalize",
                          getCategoryColor(event.category)
                        )}
                      >
                        {event.category}
                      </Badge>
                      {event.llm_parsed && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 border-violet-200"
                        >
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <span className="hidden sm:block shrink-0 text-xs text-muted-foreground">
                    {format(new Date(event.start_date), "MMM d")}
                  </span>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleAction(event.id, "approve")}
                      disabled={isLoading}
                      title="Approve"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleAction(event.id, "reject")}
                      disabled={isLoading}
                      title="Reject"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
