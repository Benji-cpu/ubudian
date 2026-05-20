import Link from "next/link";
import Image from "next/image";
import type { Practitioner } from "@/types";

interface PractitionerCardProps {
  practitioner: Practitioner;
}

export function PractitionerCard({ practitioner: p }: PractitionerCardProps) {
  const image = p.hero_image_url ?? p.photo_url ?? null;
  return (
    <Link
      href={`/practitioners/${p.slug}`}
      className="group block overflow-hidden rounded-sm border border-brand-gold/15 bg-card transition-all hover:border-brand-gold/40 hover:shadow-sm"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-deep-green/10">
        {image ? (
          <Image
            src={image}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-3xl text-brand-deep-green/60">
            {p.name
              .split(/\s+/)
              .map((s) => s[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-lg font-medium leading-snug text-brand-deep-green">
          {p.name}
        </h3>
        {p.short_description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-brand-charcoal-light">
            {p.short_description}
          </p>
        )}
        {p.modalities.length > 0 && (
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-brand-gold">
            {p.modalities.slice(0, 3).join(" · ")}
          </p>
        )}
        {p.base_location && (
          <p className="mt-1.5 text-xs text-brand-charcoal-light">
            {p.base_location}
          </p>
        )}
      </div>
    </Link>
  );
}
