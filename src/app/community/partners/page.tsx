import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listActiveSponsors } from "@/lib/sponsors/sponsor-service";
import type { Sponsor } from "@/types";

export const metadata: Metadata = {
  title: "Community Partners",
  description:
    "The studios, ceremony spaces, healers, restaurants and villas who hold this platform with us — and who you can lean into when you arrive in Ubud.",
};

const TIER_COPY: Record<Sponsor["tier"], string> = {
  anchor: "Anchor partner",
  partner: "Partner",
  patron: "Patron",
};

export default async function CommunityPartnersPage() {
  const sponsors = await listActiveSponsors();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="font-serif text-sm uppercase tracking-[0.25em] text-brand-gold">
          Community Partners
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-brand-deep-green md:text-5xl">
          The hands that hold the platform
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          The Ubudian is independent. These are the local studios, ceremony spaces, healers,
          restaurants and villas who help sustain it — and who we&apos;d send you to without
          hesitation when you arrive.
        </p>
      </header>

      {sponsors.length === 0 ? (
        <p className="mt-16 text-muted-foreground">No partners listed yet — check back soon.</p>
      ) : (
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <PartnerCard key={s.id} sponsor={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <Link
      href={`/community/partners/${sponsor.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-brand-cream">
        {sponsor.hero_image_url || sponsor.logo_url ? (
          <Image
            src={sponsor.hero_image_url ?? sponsor.logo_url!}
            alt={sponsor.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            unoptimized
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-brand-deep-green/30">
            ·
          </div>
        )}
      </div>
      <div className="mt-5">
        <p className="font-serif text-xs uppercase tracking-[0.2em] text-brand-gold/80">
          {TIER_COPY[sponsor.tier]}
          {sponsor.category_sponsor && (
            <>
              <span className="mx-1.5 opacity-50">·</span>
              {sponsor.category_sponsor}
            </>
          )}
        </p>
        <h2 className="mt-2 font-serif text-2xl text-brand-deep-green decoration-brand-gold/40 underline-offset-4 group-hover:underline">
          {sponsor.name}
        </h2>
        {sponsor.tagline && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sponsor.tagline}</p>
        )}
      </div>
    </Link>
  );
}
