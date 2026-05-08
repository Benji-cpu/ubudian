import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { GuideMarkdown } from "@/components/guides/guide-markdown";
import { MentionedInGuide } from "@/components/guides/mentioned-in-guide";
import { GuideCard } from "@/components/guides/guide-card";
import { GUIDE_INTENTS, getIntentConfig } from "@/lib/guides/intents";
import { eventLinkForIntent } from "@/lib/guides/intent-to-event-categories";
import type { Guide, Journey } from "@/types";
import type { ResolvedRefs } from "@/lib/guides/shortcodes";

interface IntentGuideProps {
  guide: Guide;
  resolved: ResolvedRefs;
  linkedRetreat: Journey | null;
  relatedGuides: Guide[];
}

export function IntentGuide({
  guide,
  resolved,
  linkedRetreat,
  relatedGuides,
}: IntentGuideProps) {
  const primaryIntent = guide.intent_tags[0] ?? null;
  const intentConfig = primaryIntent ? getIntentConfig(primaryIntent) : null;
  const allIntentLabels = guide.intent_tags
    .map((id) => GUIDE_INTENTS.find((i) => i.id === id)?.label)
    .filter((l): l is string => Boolean(l));

  return (
    <article className="bg-white">
      {/* Full-bleed hero */}
      <header className="relative overflow-hidden text-brand-cream">
        {guide.hero_image_url ? (
          <Image
            src={guide.hero_image_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-deep-green" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-brand-deep-green/45 via-brand-deep-green/55 to-brand-deep-green/85"
        />

        <div className="relative mx-auto flex min-h-[78svh] max-w-5xl flex-col justify-end px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40 lg:px-8">
          <Link
            href="/guides"
            className="self-start inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-brand-cream/80 transition-colors hover:text-brand-cream"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            The Guides
          </Link>

          {allIntentLabels.length > 0 && (
            <p className="mt-10 text-[11px] uppercase tracking-[0.28em] text-brand-gold">
              {allIntentLabels.join(" · ")}
            </p>
          )}
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {guide.title}
          </h1>
          {guide.subtitle && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-cream/85 sm:text-xl">
              {guide.subtitle}
            </p>
          )}
          {guide.hero_quote && (
            <p className="mt-10 max-w-2xl border-l-2 border-brand-gold/60 pl-5 font-serif text-lg italic leading-relaxed text-brand-cream/90 sm:text-xl">
              {guide.hero_quote}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        {guide.intro_md && (
          <p className="mb-16 font-serif text-2xl font-medium leading-snug text-brand-deep-green sm:text-3xl">
            {guide.intro_md}
          </p>
        )}
        <GuideMarkdown body={guide.body_md} resolved={resolved} variant="intent" />
      </section>

      {/* Mentioned in this guide */}
      <MentionedInGuide resolved={resolved} />

      {/* Tail CTAs */}
      <section className="border-t border-brand-gold/15 bg-brand-deep-green text-brand-cream">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            {linkedRetreat && (
              <Link
                href={`/experiences/${linkedRetreat.slug}`}
                className="group block"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                  Want this hand-held?
                </p>
                <h3 className="mt-4 font-serif text-3xl font-medium leading-snug sm:text-4xl">
                  {linkedRetreat.title}
                </h3>
                {linkedRetreat.subtitle && (
                  <p className="mt-3 text-base leading-relaxed text-brand-cream/80">
                    {linkedRetreat.subtitle}
                  </p>
                )}
                <span className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-brand-gold transition-transform duration-300 group-hover:translate-x-1">
                  See the retreat
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            )}

            {primaryIntent && intentConfig && (
              <Link
                href={eventLinkForIntent(primaryIntent)}
                className="group block"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                  This week in Ubud
                </p>
                <h3 className="mt-4 font-serif text-3xl font-medium leading-snug sm:text-4xl">
                  Live events for {intentConfig.label.toLowerCase()}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-brand-cream/80">
                  Open the events calendar, pre-filtered to what this guide is
                  actually about.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-brand-gold transition-transform duration-300 group-hover:translate-x-1">
                  See what&apos;s on
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Continue reading */}
      {relatedGuides.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mb-12">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              Continue
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
              Read next
            </h2>
          </div>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {relatedGuides.slice(0, 3).map((g) => (
              <GuideCard key={g.id} guide={g} variant="intent-medium" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
