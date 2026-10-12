import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaceBySlug, getRelatedPlaces } from "@/lib/places/queries";
import { PlaceDetail } from "@/components/places/place-detail";
import { PlaceCard } from "@/components/places/place-card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { MentionedInGuides } from "@/components/cross-links/mentioned-in-guides";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return { title: "Place" };
  return {
    title: `${place.name}`,
    description:
      place.short_description ?? place.description?.slice(0, 160) ?? undefined,
  };
}

export default async function PlacePage({ params }: PageProps) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const related = await getRelatedPlaces(place);

  return (
    <>
      <PlaceDetail place={place} />

      <MentionedInGuides refKind="place" refSlug={place.slug} />

      {related.length > 0 && (
        <section className="bg-brand-cream/40 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              {place.neighbourhood ?? "Also worth visiting"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
              Nearby
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <PlaceCard place={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="border-t border-brand-gold/20 px-4 py-12 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold">
            Ubud&apos;s best deals and what&apos;s on, every Wednesday
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">One short email. Free. Unsubscribe any time.</p>
          <NewsletterSignup source="place" className="mx-auto mt-6 max-w-md" />
        </div>
      </section>
    </>
  );
}
