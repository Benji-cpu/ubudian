"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveEventButton } from "@/components/dashboard/save-event-button";
import { CopyIcsUrl } from "@/components/dashboard/copy-ics-url";
import { EventGridCard } from "@/components/events/event-grid-card";
import { CalendarPlus, Heart, CalendarCheck2 } from "lucide-react";
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
  icsUrl: string;
}

/**
 * Returns a friendly label for a day relative to "now":
 *  - "Today" / "Tomorrow" when applicable
 *  - "Saturday, April 25" otherwise
 */
function formatDayLabel(date: Date, now: Date): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return format(date, "EEEE, MMMM d");
}

export function DashboardEventsTabs({
  submittedEvents,
  savedEvents: initialSavedEvents,
  profileId,
  icsUrl,
}: DashboardEventsTabsProps) {
  const [savedEvents, setSavedEvents] = useState(initialSavedEvents);

  function handleUnsave(eventId: string) {
    setSavedEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  // Group saved events by day (ISO date string)
  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of savedEvents) {
      const key = event.start_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [savedEvents]);

  const now = new Date();

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-brand-deep-green">My Agenda</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your saved events, grouped by day. Subscribe below to sync with your calendar app.
      </p>

      <Tabs defaultValue="saved" className="mt-6">
        <TabsList>
          <TabsTrigger value="saved">
            Saved ({savedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-6">
          {savedEvents.length === 0 ? (
            <div className="rounded-xl border border-brand-gold/20 bg-brand-cream/40 py-16 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">
                You haven&apos;t saved any events yet.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(([dayKey, events]) => {
                const dayDate = parseISO(dayKey);
                return (
                  <section key={dayKey}>
                    <h2 className="font-serif text-lg font-medium text-brand-deep-green">
                      {formatDayLabel(dayDate, now)}
                    </h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {events.map((event) => (
                        <EventGridCard
                          key={event.id}
                          event={event}
                          saveButton={
                            <SaveEventButton
                              eventId={event.id}
                              profileId={profileId}
                              initialSaved={true}
                              onUnsave={() => handleUnsave(event.id)}
                            />
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* ICS subscribe card — always visible so users can set this up
              proactively */}
          <div className="mt-10 rounded-xl border border-brand-gold/20 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-deep-green/10 text-brand-deep-green">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-medium text-brand-deep-green">
                  Subscribe in your calendar app
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saved events flow straight into your calendar — updates and new saves
                  appear automatically.
                </p>
                <div className="mt-4">
                  <CopyIcsUrl url={icsUrl} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Works in Apple Calendar, Google Calendar, and Outlook. Keep this link
                  private — anyone with it can see your agenda.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

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
      </Tabs>
    </div>
  );
}
