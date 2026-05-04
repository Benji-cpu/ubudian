"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { isSafeUrl } from "@/lib/url-validation";
import "leaflet/dist/leaflet.css";
import type { Event } from "@/types";

interface EventMapProps {
  event: Event;
}

export function EventMap({ event }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (event.latitude == null || event.longitude == null) return;
    if (!containerRef.current) return;

    let destroyed = false;
    let mapInstance: { remove: () => void } | null = null;

    // Dynamically import leaflet so it never runs during SSR
    (async () => {
      const L = (await import("leaflet")).default;
      if (destroyed || !containerRef.current) return;

      // Fix default marker icon paths (Leaflet's default assets)
      // Reset any broken default icon URL resolution from bundlers
      type IconDefaultProto = {
        _getIconUrl?: () => string;
      };
      const proto = L.Icon.Default.prototype as unknown as IconDefaultProto;
      delete proto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const lat = event.latitude as number;
      const lng = event.longitude as number;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      if (event.venue_name) {
        marker.bindPopup(
          `<strong>${escapeHtml(event.venue_name)}</strong>${
            event.venue_address
              ? `<br/><span>${escapeHtml(event.venue_address)}</span>`
              : ""
          }`
        );
      }

      mapInstance = map;
      mapRef.current = map;
    })().catch((err) => {
      // Fail silently — the fallback UI in the render branch still covers us
      console.warn("Failed to initialize Leaflet map:", err);
    });

    return () => {
      destroyed = true;
      if (mapInstance) {
        mapInstance.remove();
      }
      mapRef.current = null;
    };
  }, [event.latitude, event.longitude, event.venue_name, event.venue_address]);

  // Fallback: no coordinates
  if (event.latitude == null || event.longitude == null) {
    const mapUrl = event.venue_map_url && isSafeUrl(event.venue_map_url) ? event.venue_map_url : null;
    return (
      <div className="rounded-xl border border-brand-gold/20 bg-brand-cream/40 p-6 text-center">
        <MapPin className="mx-auto h-6 w-6 text-brand-gold" />
        <p className="mt-2 text-sm text-muted-foreground">
          {event.venue_name
            ? `Map pending for ${event.venue_name}.`
            : "No coordinates available for this venue yet."}
        </p>
        {mapUrl && (
          <Button asChild variant="outline" className="mt-4">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Google Maps
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-brand-gold/20 shadow-sm">
      <div
        ref={containerRef}
        className="h-[320px] w-full md:h-[400px]"
        aria-label={
          event.venue_name
            ? `Map showing the location of ${event.venue_name}`
            : "Event location map"
        }
        role="region"
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
