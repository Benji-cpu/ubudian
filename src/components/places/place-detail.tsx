import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Instagram, Globe } from "lucide-react";
import type { Place } from "@/types";

const KIND_LABELS: Record<string, string> = {
  temple: "Temple",
  venue: "Venue",
  cafe: "Café",
  restaurant: "Restaurant",
  studio: "Studio",
  spa: "Spa",
  retreat_centre: "Retreat centre",
  natural: "Natural",
  market: "Market",
  other: "Place",
};

interface PlaceDetailProps {
  place: Place;
}

export function PlaceDetail({ place: p }: PlaceDetailProps) {
  const image = p.hero_image_url ?? p.photo_urls[0] ?? null;
  const descriptionParagraphs = (p.description ?? "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const kindLabel = KIND_LABELS[p.kind] ?? "Place";

  return (
    <article className="bg-brand-cream">
      <header className="relative">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-brand-deep-green/10 sm:aspect-[21/8]">
          {image ? (
            <Image
              src={image}
              alt={p.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-5xl text-brand-deep-green/40">
              {p.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          {image && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          )}
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
          {kindLabel}
          {p.neighbourhood ? ` · ${p.neighbourhood}` : ""}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
          {p.name}
        </h1>
        {p.short_description && (
          <p className="mt-4 text-lg italic text-brand-charcoal-light">
            {p.short_description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-brand-charcoal-light">
          {p.address && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-gold" />
              {p.address}
            </span>
          )}
          {p.opening_hours && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-gold" />
              {p.opening_hours}
            </span>
          )}
          {p.price_range && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
              {p.price_range}
            </span>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {descriptionParagraphs.length > 0 ? (
          <div className="prose prose-lg max-w-none font-serif text-brand-charcoal">
            {descriptionParagraphs.map((para, i) => (
              <p key={i} className="leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm italic text-brand-charcoal-light">
            Description coming soon.
          </p>
        )}
      </section>

      {(p.google_maps_url || p.website_url || p.instagram_handle) && (
        <section className="border-y border-brand-gold/15 bg-brand-cream/40">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-6 px-4 py-8 text-sm sm:px-6 lg:px-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              Find it
            </p>
            {p.google_maps_url && (
              <Link
                href={p.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-deep-green hover:text-brand-gold"
              >
                <MapPin className="h-4 w-4" />
                Open in Maps
              </Link>
            )}
            {p.website_url && (
              <Link
                href={p.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-deep-green hover:text-brand-gold"
              >
                <Globe className="h-4 w-4" />
                Website
              </Link>
            )}
            {p.instagram_handle && (
              <Link
                href={`https://instagram.com/${p.instagram_handle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-deep-green hover:text-brand-gold"
              >
                <Instagram className="h-4 w-4" />@{p.instagram_handle.replace(/^@/, "")}
              </Link>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
