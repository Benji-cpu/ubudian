import Link from "next/link";
import Image from "next/image";
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
  other: "",
};

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place: p }: PlaceCardProps) {
  const image = p.hero_image_url ?? p.photo_urls[0] ?? null;
  const kindLabel = KIND_LABELS[p.kind] ?? "";
  return (
    <Link
      href={`/places/${p.slug}`}
      className="group block overflow-hidden rounded-sm border border-brand-gold/15 bg-card transition-all hover:border-brand-gold/40 hover:shadow-sm"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-deep-green/10">
        {image ? (
          <Image
            src={image}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-brand-deep-green/60">
            {p.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-5">
        {(kindLabel || p.neighbourhood) && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
            {[kindLabel, p.neighbourhood].filter(Boolean).join(" · ")}
          </p>
        )}
        <h3 className="mt-2 font-serif text-lg font-medium leading-snug text-brand-deep-green">
          {p.name}
        </h3>
        {p.short_description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-brand-charcoal-light">
            {p.short_description}
          </p>
        )}
      </div>
    </Link>
  );
}
