"use client";

/**
 * Lightweight "Where you'll go" map for a journey detail page.
 *
 * Plots one marker per atom with lat/lng (places, restaurants, accommodation,
 * practitioner studios). No clustering — typically <10 markers per journey.
 * Markers are colour-coded by atom kind so the eye can scan: gold for places,
 * terracotta for restaurants, deep-green for practitioners/accommodations.
 *
 * Lazy-loads leaflet client-side. Renders a small footprint placeholder during
 * mount so the page doesn't reflow.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { JourneyAtom, JourneyAtomKind } from "@/types";

interface JourneyMapProps {
  atoms: JourneyAtom[];
}

const UBUD_CENTER: [number, number] = [-8.5069, 115.2625];

const KIND_COLOR: Record<JourneyAtomKind, string> = {
  event_ref: "#C9A84C",
  accommodation: "#2C4A3E",
  restaurant: "#B85C3F",
  practitioner: "#3A5F50",
  place: "#C9A84C",
  ritual: "#8BAF8A",
  reflection: "#8BAF8A",
};

export function JourneyMap({ atoms }: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const mappable = useMemo(
    () =>
      atoms.filter(
        (a) =>
          typeof a.latitude === "number" &&
          typeof a.longitude === "number" &&
          Number.isFinite(a.latitude) &&
          Number.isFinite(a.longitude)
      ),
    [atoms]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || mappable.length === 0) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const points = mappable.map(
        (a) => [a.latitude as number, a.longitude as number] as [number, number]
      );
      const bounds = L.latLngBounds(points.length > 0 ? points : [UBUD_CENTER]);

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      for (const atom of mappable) {
        const colour = KIND_COLOR[atom.kind] ?? "#C9A84C";
        const marker = L.circleMarker([atom.latitude as number, atom.longitude as number], {
          radius: 9,
          color: "#2C4A3E",
          weight: 2,
          fillColor: colour,
          fillOpacity: 0.9,
        }).addTo(map);
        const popup = `<div style="font-family:Georgia,serif;min-width:140px"><strong>${escapeHtml(atom.title)}</strong>${atom.short_description ? `<br/><span style="font-size:12px;color:#555">${escapeHtml(atom.short_description)}</span>` : ""}</div>`;
        marker.bindPopup(popup);
      }

      cleanup = () => {
        map.remove();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [mounted, mappable]);

  if (mappable.length === 0) return null;

  return (
    <section className="border-t bg-brand-cream/30 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">Geography</span>
          <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green">
            Where you&apos;ll go
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mappable.length} {mappable.length === 1 ? "place" : "places"} you&apos;ll touch over this retreat. Drag, zoom, and tap a marker.
          </p>
        </div>
        <div
          ref={containerRef}
          className="h-[360px] w-full overflow-hidden rounded-md border border-brand-gold/20 shadow-sm sm:h-[420px]"
          aria-label="Map of retreat locations in Ubud"
        />
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <KindLegend colour="#C9A84C" label="Places" />
          <KindLegend colour="#B85C3F" label="Restaurants" />
          <KindLegend colour="#3A5F50" label="Practitioners" />
        </div>
      </div>
    </section>
  );
}

function KindLegend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-brand-deep-green/40"
        style={{ backgroundColor: colour }}
      />
      {label}
    </span>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
