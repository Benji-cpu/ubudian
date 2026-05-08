import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rankJourneysByArchetype } from "@/lib/journeys/journey-personalization";
import type { ArchetypeId, Journey } from "@/types";

interface RecommendedRetreatCtaProps {
  primary: ArchetypeId;
  secondary?: ArchetypeId | null;
}

/**
 * Surfaced on the quiz results page as the concrete next step: the journey
 * whose archetype tags align best with the user's quiz outcome. Uses the
 * existing `rankJourneysByArchetype()` helper so personalisation logic stays
 * in one place.
 */
export async function RecommendedRetreatCta({
  primary,
  secondary,
}: RecommendedRetreatCtaProps) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journeys")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  const all = (data ?? []) as Journey[];
  if (all.length === 0) return null;

  const ranked = rankJourneysByArchetype(all, { primary, secondary: secondary ?? null });
  const top = ranked[0];
  if (!top) return null;

  return (
    <section className="bg-brand-deep-green px-4 py-14 text-brand-cream">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md md:aspect-[5/4]">
          {top.cover_image_url ? (
            <Image
              src={top.cover_image_url}
              alt={top.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-deep-green via-[#3A5F50] to-brand-terracotta" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-gold">
            Based on your shape
          </p>
          <h2 className="mt-2 font-serif text-3xl font-medium leading-tight sm:text-4xl">
            Start with: {top.title}
          </h2>
          {top.subtitle && (
            <p className="mt-2 text-base italic opacity-90">{top.subtitle}</p>
          )}
          {top.summary && (
            <p className="mt-4 line-clamp-3 text-sm opacity-85">
              {top.summary.split("\n")[0]}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-wider text-brand-gold">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {top.length_days} {top.length_days === 1 ? "day" : "days"}
            </span>
          </div>
          <Link
            href={`/experiences/${top.slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-gold px-5 py-3 text-sm font-semibold uppercase tracking-wider text-brand-deep-green transition-colors hover:bg-brand-gold/90"
          >
            Open the retreat
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
