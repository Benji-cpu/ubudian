import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Partner } from "@/types";

const KIND_LABELS: Record<string, string> = {
  villa: "Villa",
  hotel: "Hotel",
  homestay: "Homestay",
  restaurant: "Restaurant",
  cafe: "Café",
  studio: "Studio",
  spa: "Spa",
  other: "Partner",
};

interface PartnerDetailProps {
  partner: Partner;
}

export function PartnerDetail({ partner: p }: PartnerDetailProps) {
  const image = p.hero_image_url ?? null;
  const descriptionParagraphs = (p.description ?? "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const kindLabel = KIND_LABELS[p.kind] ?? "Partner";

  return (
    <article className="bg-brand-cream">
      <header className="relative">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-deep-green/10 sm:aspect-[21/9]">
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
          {p.base_location ? ` · ${p.base_location}` : ""}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
          {p.name}
        </h1>
        {p.short_description && (
          <p className="mt-4 text-lg italic text-brand-charcoal-light">
            {p.short_description}
          </p>
        )}
        {p.base_location && (
          <div className="mt-6 inline-flex items-center gap-1.5 text-sm text-brand-charcoal-light">
            <MapPin className="h-3.5 w-3.5 text-brand-gold" />
            {p.base_location}
          </div>
        )}
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
            Profile coming soon.
          </p>
        )}
      </section>

      {p.affiliate_url && (
        <section className="mx-auto max-w-3xl px-4 pb-6 sm:px-6 lg:px-8">
          <Link
            href={p.affiliate_url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-sm border border-brand-gold/40 px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-brand-deep-green transition-colors hover:bg-brand-deep-green hover:text-brand-cream"
          >
            Visit {p.name}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </section>
      )}

      <footer className="border-t border-brand-gold/15 bg-brand-cream/40">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs uppercase tracking-[0.2em] text-brand-charcoal-light sm:px-6 lg:px-8">
          Sponsored partner of The Ubudian
        </div>
      </footer>
    </article>
  );
}
