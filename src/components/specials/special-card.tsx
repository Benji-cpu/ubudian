import { Clock, MapPin, Instagram, Globe } from "lucide-react";
import type { Special } from "@/types";
import { formatHours, formatIdr, formatWeekdays } from "@/lib/specials";

function mapsHref(s: Special): string {
  if (s.google_maps_url) return s.google_maps_url;
  const q = [s.venue_name, s.venue_address || s.venue_area, "Ubud"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function SpecialCard({ special, showDays = true }: { special: Special; showDays?: boolean }) {
  const hours = formatHours(special.start_time, special.end_time);
  const price = formatIdr(special.price_idr);
  const handle = special.instagram_handle?.replace(/^@/, "");

  return (
    <article className="rounded-xl border border-brand-gold/20 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta">
            {special.venue_name}
            {special.venue_area ? (
              <span className="font-normal normal-case tracking-normal text-muted-foreground"> · {special.venue_area}</span>
            ) : null}
          </p>
          <h3 className="mt-1 font-serif text-xl text-brand-deep-green dark:text-brand-gold">{special.title}</h3>
        </div>
        {price ? (
          <span className="shrink-0 rounded-full bg-brand-gold/15 px-3 py-1 text-sm font-semibold text-brand-deep-green dark:text-brand-gold">
            {price}
          </span>
        ) : null}
      </div>

      {special.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{special.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {(showDays || hours) && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden />
            {[showDays ? formatWeekdays(special.weekdays) : null, hours].filter(Boolean).join(" · ")}
          </span>
        )}
        <a
          href={mapsHref(special)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-brand-deep-green hover:underline dark:hover:text-brand-gold"
        >
          <MapPin className="h-4 w-4" aria-hidden />
          Directions
        </a>
        {handle ? (
          <a
            href={`https://instagram.com/${encodeURIComponent(handle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-brand-deep-green hover:underline dark:hover:text-brand-gold"
          >
            <Instagram className="h-4 w-4" aria-hidden />@{handle}
          </a>
        ) : special.website_url ? (
          <a
            href={special.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-brand-deep-green hover:underline dark:hover:text-brand-gold"
          >
            <Globe className="h-4 w-4" aria-hidden />
            Website
          </a>
        ) : null}
      </div>
    </article>
  );
}
