"use client";

/**
 * MapView — discovery map for the /events page.
 *
 * Renders a Leaflet map centered on Ubud with clustered markers for every
 * event that has lat/lng. Clicking a marker opens a Sheet with a compact
 * event card and a "View details" link to /events/[slug].
 *
 * Leaflet requires a browser DOM, so we guard the render with a mounted
 * flag and dynamically import leaflet + leaflet.markercluster inside a
 * useEffect. We don't use react-leaflet here because markercluster's
 * integration with it is fiddly; driving Leaflet imperatively is simpler.
 */

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock, MapPin, User } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { formatEventTime } from "@/lib/utils";
import type { Event } from "@/types";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface MapViewProps {
  events: Event[];
}

const UBUD_CENTER: [number, number] = [-8.5069, 115.2625];
const UBUD_ZOOM = 13;

// Brand gold — used for marker fill.
const MARKER_FILL = "#C9A84C";
const MARKER_STROKE = "#2C4A3E";

export function MapView({ events }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [selected, setSelected] = useState<Event | null>(null);
  const [mounted, setMounted] = useState(false);

  const mappable = useMemo(
    () =>
      events.filter(
        (e) =>
          typeof e.latitude === "number" &&
          typeof e.longitude === "number" &&
          Number.isFinite(e.latitude) &&
          Number.isFinite(e.longitude)
      ),
    [events]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      // Dynamically load Leaflet client-side only
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");

      if (cancelled || !containerRef.current) return;

      // Tear down any prior instance (fast refresh / prop changes)
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(containerRef.current, {
        center: UBUD_CENTER,
        zoom: UBUD_ZOOM,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const clusterLayer = (
        L as unknown as {
          markerClusterGroup: (opts?: Record<string, unknown>) => unknown;
        }
      ).markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 50,
      });

      const makeIcon = () =>
        L.divIcon({
          className: "ubudian-map-marker",
          html: `<span style="display:inline-block;width:22px;height:22px;border-radius:9999px;background:${MARKER_FILL};border:2px solid ${MARKER_STROKE};box-shadow:0 2px 6px rgba(0,0,0,0.25);"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

      for (const evt of mappable) {
        const marker = L.marker([evt.latitude as number, evt.longitude as number], {
          icon: makeIcon(),
          title: evt.title,
        });
        marker.on("click", () => setSelected(evt));
        (
          clusterLayer as { addLayer: (layer: unknown) => void }
        ).addLayer(marker);
      }

      (map as unknown as { addLayer: (l: unknown) => void }).addLayer(
        clusterLayer
      );

      // Fit to bounds when we have pins; otherwise stay on Ubud
      if (mappable.length > 0) {
        const bounds = L.latLngBounds(
          mappable.map((e) => [e.latitude as number, e.longitude as number])
        );
        map.fitBounds(bounds.pad(0.25), { maxZoom: 15 });
      }

      cleanup = () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [mounted, mappable]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[70vh] w-full overflow-hidden rounded-lg border border-brand-gold/20 bg-brand-cream/40"
        aria-label="Map of events in Ubud"
        role="region"
      />

      <p className="mt-3 text-sm text-muted-foreground">
        {mappable.length === 0
          ? "No events with map coordinates yet — we're geocoding venues in the background."
          : `${mappable.length} of ${events.length} events pinned on the map.`}
      </p>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-md"
        >
          {selected && <SelectedEventCard event={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SelectedEventCard({ event }: { event: Event }) {
  const startDate = new Date(event.start_date);
  const emoji = CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI["Other"];

  return (
    <div className="flex flex-col">
      {event.cover_image_url ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-cream">
          <Image
            src={event.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-brand-cream text-5xl">
          {emoji}
        </div>
      )}

      <SheetHeader className="px-5 pb-2 pt-5">
        <Badge className="mb-2 w-fit bg-brand-deep-green/10 text-brand-deep-green hover:bg-brand-deep-green/10">
          {emoji} {event.category}
        </Badge>
        <SheetTitle className="font-serif text-xl leading-snug text-brand-deep-green">
          {event.title}
        </SheetTitle>
        {event.short_description && (
          <SheetDescription>{event.short_description}</SheetDescription>
        )}
      </SheetHeader>

      <div className="space-y-2 px-5 pb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-gold" />
          <span>{format(startDate, "EEE, MMM d")}</span>
        </div>
        {(event.start_time || event.end_time) && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-gold" />
            <span>{formatEventTime(event.start_time, event.end_time)}</span>
          </div>
        )}
        {event.venue_name && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-gold" />
            <span>{event.venue_name}</span>
          </div>
        )}
        {event.organizer_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-brand-gold" />
            <span>{event.organizer_name}</span>
          </div>
        )}
        {event.price_info && (
          <div className="text-sm font-medium text-brand-terracotta">
            {event.price_info}
          </div>
        )}
      </div>

      <div className="px-5 pb-6">
        <Button asChild className="w-full">
          <Link href={`/events/${event.slug}`}>View details</Link>
        </Button>
      </div>
    </div>
  );
}
