"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import { CalendarPlus, Heart } from "lucide-react";
import type { Event } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-800",
};

interface DashboardEventsTabsProps {
  submittedEvents: Event[];
  savedEvents: Event[];
  profileId: string;
}

export function DashboardEventsTabs({
  submittedEvents,
  savedEvents: initialSavedEvents,
  profileId,
}: DashboardEventsTabsProps) {
  const [savedEvents, setSavedEvents] = useState(initialSavedEvents);

  function handleUnsave(eventId: string) {
    setSavedEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium">My Events</h1>

      <Tabs defaultValue="submitted" className="mt-6">
        <TabsList>
          <TabsTrigger value="submitted">
            Submitted ({submittedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved ({savedEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submitted" className="mt-4">
          {submittedEvents.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarPlus className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">
                You haven&apos;t submitted any events yet.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/events/submit">Submit an Event</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedEvents.map((event) => (
                <Link
                  key={event.id}
                  href={event.status === "approved" ? `/events/${event.slug}` : "#"}
                  className={event.status === "approved" ? "block" : "pointer-events-none block"}
                >
                  <div className="flex items-center justify-between rounded-lg border border-brand-gold/10 bg-card p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium line-clamp-1">{event.title}</h3>
                        <Badge className={STATUS_STYLES[event.status] ?? ""}>
                          {event.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {format(new Date(event.start_date), "MMM d, yyyy")}
                        {event.venue_name && ` · ${event.venue_name}`}
                      </p>
                      {event.status === "rejected" && event.rejection_reason && (
                        <p className="mt-1 text-sm text-red-600">
                          Reason: {event.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {savedEvents.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">
                You haven&apos;t saved any events yet.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-brand-gold/10 bg-card p-4"
                >
                  <Link
                    href={`/events/${event.slug}`}
                    className="min-w-0 flex-1"
                  >
                    <h3 className="font-medium line-clamp-1 hover:text-primary">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(new Date(event.start_date), "MMM d, yyyy")}
                      {event.venue_name && ` · ${event.venue_name}`}
                    </p>
                  </Link>
                  <SaveEventButton
                    eventId={event.id}
                    profileId={profileId}
                    initialSaved={true}
                    onUnsave={() => handleUnsave(event.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
