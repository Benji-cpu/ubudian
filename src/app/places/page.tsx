import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { getPublishedPlaces } from "@/lib/places/queries";
import { PlaceCard } from "@/components/places/place-card";
import type { PlaceKind } from "@/types";

export const metadata: Metadata = {
  title: "Places",
  description:
    "Temples, studios, cafés and quiet rooms — the venues the guides and journeys lean on.",
};

const KIND_LABELS: Record<PlaceKind, string> = {
  temple: "Temples",
  venue: "Venues",
  cafe: "Cafés",
  restaurant: "Restaurants",
  studio: "Studios",
  spa: "Spas",
  retreat_centre: "Retreat centres",
  natural: "Outdoors",
  market: "Markets",
  other: "Other",
};

interface PageProps {
  searchParams: Promise<{ kind?: string }>;
}

export default async function PlacesPage({ searchParams }: PageProps) {
  const { kind } = await searchParams;
  const all = await getPublishedPlaces();

  const kinds = Array.from(new Set(all.map((p) => p.kind))).sort();
  const visible = kind ? all.filter((p) => p.kind === kind) : all;

  return (
    <>
      <PageHero
        variant="cream"
        kicker="The Venues"
        title="Places"
        subtitle="Temples, studios, cafés — the rooms our guides and journeys keep returning to."
      />

      {kinds.length > 0 && (
        <section className="border-b border-brand-gold/15 bg-brand-cream/60">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/places"
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] transition-colors ${
                !kind
                  ? "border-brand-deep-green bg-brand-deep-green text-brand-cream"
                  : "border-brand-gold/30 text-brand-charcoal-light hover:border-brand-deep-green hover:text-brand-deep-green"
              }`}
            >
              All
            </Link>
            {kinds.map((k) => {
              const active = kind === k;
              return (
                <Link
                  key={k}
                  href={`/places?kind=${k}`}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? "border-brand-deep-green bg-brand-deep-green text-brand-cream"
                      : "border-brand-gold/30 text-brand-charcoal-light hover:border-brand-deep-green hover:text-brand-deep-green"
                  }`}
                >
                  {KIND_LABELS[k as PlaceKind] ?? k}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-brand-cream py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {visible.length === 0 ? (
            <p className="py-16 text-center text-sm italic text-brand-charcoal-light">
              No places match that filter yet.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <li key={p.id}>
                  <PlaceCard place={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
