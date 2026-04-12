import { MapPin, Ticket, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSafeUrl } from "@/lib/url-validation";
import type { Event } from "@/types";

interface AttendanceInfoProps {
  event: Event;
}

export function AttendanceInfo({ event }: AttendanceInfoProps) {
  const hasTicketUrl =
    event.external_ticket_url && isSafeUrl(event.external_ticket_url);
  const hasPrice = !!event.price_info;

  let attendanceLabel: string;
  let attendanceDescription: string | null = null;

  if (hasTicketUrl) {
    attendanceLabel = "Registration required";
    attendanceDescription = event.price_info || null;
  } else if (hasPrice) {
    attendanceLabel = "Walk-in welcome";
    attendanceDescription = event.price_info;
  } else {
    attendanceLabel = "Walk-in welcome";
    attendanceDescription = "Free event";
  }

  const hasVenue = event.venue_name || event.venue_address;

  return (
    <div className="rounded-lg border border-brand-gold/20 bg-brand-cream p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-deep-green">
        How to Attend
      </h3>

      <div className="mt-3 space-y-3">
        {/* Attendance mode */}
        <div className="flex items-start gap-3">
          {hasTicketUrl ? (
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-brand-terracotta" />
          ) : (
            <DoorOpen className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep-green" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {attendanceLabel}
            </p>
            {attendanceDescription && (
              <p className="text-sm text-muted-foreground">
                {attendanceDescription}
              </p>
            )}
            {hasTicketUrl && (
              <Button asChild size="sm" className="mt-2" variant="default">
                <a
                  href={event.external_ticket_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Ticket className="mr-1.5 h-3.5 w-3.5" />
                  Get Tickets
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Venue */}
        {hasVenue && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            <div>
              {event.venue_name && (
                <p className="text-sm font-medium text-foreground">
                  {event.venue_name}
                </p>
              )}
              {event.venue_address && (
                <p className="text-sm text-muted-foreground">
                  {event.venue_address}
                </p>
              )}
              {event.venue_map_url && isSafeUrl(event.venue_map_url) && (
                <a
                  href={event.venue_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <MapPin className="h-3 w-3" />
                  View on Maps
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
