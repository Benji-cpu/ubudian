import Link from "next/link";
import Image from "next/image";
import type { Partner } from "@/types";

const KIND_LABELS: Record<string, string> = {
  villa: "Villa",
  hotel: "Hotel",
  homestay: "Homestay",
  restaurant: "Restaurant",
  cafe: "Café",
  studio: "Studio",
  spa: "Spa",
  other: "",
};

interface PartnerCardProps {
  partner: Partner;
}

export function PartnerCard({ partner: p }: PartnerCardProps) {
  const image = p.hero_image_url ?? null;
  const kindLabel = KIND_LABELS[p.kind] ?? "";
  return (
    <Link
      href={`/partners/${p.slug}`}
      className="group block overflow-hidden rounded-sm border border-brand-gold/15 bg-card transition-all hover:border-brand-gold/40 hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-deep-green/10">
        {image ? (
          <Image
            src={image}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-brand-deep-green/60">
            {p.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-5">
        {(kindLabel || p.base_location) && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
            {[kindLabel, p.base_location].filter(Boolean).join(" · ")}
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
