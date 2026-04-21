import { MapPin } from "lucide-react";
import type { Event } from "@/types";

interface EventsMapPlaceholderProps {
  events: Event[];
}

// Interim placeholder until the Leaflet-based map view lands. Shows a
// summary of events with pinnable venues so the toggle has a meaningful
// response while the full map is under construction.
export function EventsMapPlaceholder({ events }: EventsMapPlaceholderProps) {
  const mappable = events.filter(
    (e) => typeof e.latitude === "number" && typeof e.longitude === "number"
  );

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-dashed border-brand-gold/30 bg-brand-cream/40 px-6 py-12 text-center">
      <MapPin className="mx-auto h-10 w-10 text-brand-gold" />
      <h3 className="mt-4 font-serif text-xl text-brand-deep-green">
        Map view is on its way
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {mappable.length > 0
          ? `${mappable.length} of ${events.length} events are already geocoded and ready to pin. Switch back to the feed for now.`
          : "We're geocoding venues in the background — check back soon."}
      </p>
    </div>
  );
}
