import Image from "next/image";
import Link from "next/link";
import { Mail, Instagram, MapPin } from "lucide-react";
import type { Practitioner } from "@/types";

interface PractitionerDetailProps {
  practitioner: Practitioner;
}

export function PractitionerDetail({ practitioner: p }: PractitionerDetailProps) {
  const image = p.hero_image_url ?? p.photo_url ?? null;
  const bioParagraphs = (p.bio ?? "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="bg-brand-cream">
      <header className="mx-auto max-w-5xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,_1fr)_360px] lg:items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              Practitioner
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
              {p.base_location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-gold" />
                  {p.base_location}
                </span>
              )}
              {p.modalities.length > 0 && (
                <span className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
                  {p.modalities.slice(0, 5).join(" · ")}
                </span>
              )}
            </div>
          </div>

          <figure className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-brand-gold/20 bg-brand-deep-green/10">
            {image ? (
              <Image
                src={image}
                alt={p.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-5xl text-brand-deep-green/60">
                {p.name
                  .split(/\s+/)
                  .map((s) => s[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            )}
          </figure>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {bioParagraphs.length > 0 ? (
          <div className="prose prose-lg max-w-none font-serif text-brand-charcoal">
            {bioParagraphs.map((para, i) => (
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

      {(p.contact_email || p.contact_whatsapp || p.contact_instagram) && (
        <section className="border-y border-brand-gold/15 bg-brand-cream/40">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-6 px-4 py-8 text-sm sm:px-6 lg:px-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              Reach out
            </p>
            {p.contact_email && (
              <a
                href={`mailto:${p.contact_email}`}
                className="inline-flex items-center gap-2 text-brand-deep-green hover:text-brand-gold"
              >
                <Mail className="h-4 w-4" />
                {p.contact_email}
              </a>
            )}
            {p.contact_whatsapp && (
              <a
                href={`https://wa.me/${p.contact_whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-deep-green hover:text-brand-gold"
              >
                <span aria-hidden>WA</span>
                <span>{p.contact_whatsapp}</span>
              </a>
            )}
            {p.contact_instagram && (
              <Link
                href={`https://instagram.com/${p.contact_instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-deep-green hover:text-brand-gold"
              >
                <Instagram className="h-4 w-4" />@{p.contact_instagram.replace(/^@/, "")}
              </Link>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
