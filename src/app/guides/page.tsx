import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideCard } from "@/components/guides/guide-card";
import { IntentRail } from "@/components/guides/intent-rail";
import {
  getEditorsPicks,
  getPublishedGuides,
} from "@/lib/guides/queries";
import { GUIDE_INTENTS, getIntentConfig, isGuideIntent } from "@/lib/guides/intents";
import type { Guide, GuideIntent } from "@/types";

export const metadata: Metadata = {
  title: "Guides | The Ubudian",
  description:
    "Free, opinionated, lived-in. Field-tested orientation for Ubud — and the playbooks for what people actually came here for.",
};

interface GuidesPageProps {
  searchParams: Promise<{ intent?: string; archetype?: string }>;
}

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const { intent: rawIntent } = await searchParams;
  const activeIntent: GuideIntent | null =
    rawIntent && isGuideIntent(rawIntent) ? rawIntent : null;

  const [editorsPicks, intentGuidesRaw, practicalGuides, filteredGuides] =
    await Promise.all([
      activeIntent ? Promise.resolve([] as Guide[]) : getEditorsPicks(5),
      activeIntent
        ? Promise.resolve([] as Guide[])
        : getPublishedGuides({ tier: "intent", limit: 9 }),
      activeIntent
        ? Promise.resolve([] as Guide[])
        : getPublishedGuides({ tier: "practical", limit: 12 }),
      activeIntent
        ? getPublishedGuides({ intent: activeIntent, limit: 24 })
        : Promise.resolve([] as Guide[]),
    ]);

  // Don't show editor's picks again in the playbooks rail.
  const editorsPickIds = new Set(editorsPicks.map((g) => g.id));
  const intentGuides = intentGuidesRaw.filter((g) => !editorsPickIds.has(g.id));

  const intentConfig = activeIntent ? getIntentConfig(activeIntent) : null;

  return (
    <div className="bg-white">
      {/* Editorial hero */}
      <section className="relative overflow-hidden bg-brand-deep-green text-brand-cream">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,168,76,0.18),_transparent_60%)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand-gold">
            The Ubudian Guides
          </p>
          <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            Free, opinionated, lived-in.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-cream/80 sm:text-xl">
            The shortcuts and the soul-work — written by people who actually
            live here, for people arriving with intent.
          </p>
          <div className="mx-auto mt-10 h-px w-12 bg-brand-gold/50" />
        </div>
      </section>

      <IntentRail activeIntent={activeIntent} />

      {/* Filtered view (when ?intent= is set) */}
      {activeIntent && intentConfig && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              {intentConfig.label}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
              {intentConfig.blurb}
            </h2>
          </div>
          {filteredGuides.length === 0 ? (
            <p className="text-lg text-brand-charcoal-light">
              No guides published for this intent yet. Check back soon.
            </p>
          ) : (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  variant={guide.tier === "intent" ? "intent-medium" : "practical"}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Default view */}
      {!activeIntent && (
        <>
          {/* Editor's Picks */}
          {editorsPicks.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                    Editor&apos;s Picks
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                    Start here
                  </h2>
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {editorsPicks.slice(0, 3).map((guide, i) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    variant="intent-large"
                    priority={i < 2}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Why You Came — intent tier */}
          {intentGuides.length > 0 && (
            <section className="border-t border-brand-gold/15 bg-brand-cream/30 py-20 sm:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 max-w-2xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                    Why You Came
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                    The playbooks
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-brand-charcoal-light sm:text-lg">
                    DIY versions of our retreats. Curated, opinionated, written
                    from the inside.
                  </p>
                </div>

                <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                  {intentGuides.map((guide) => (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      variant="intent-medium"
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Survival Guide — practical tier */}
          {practicalGuides.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
              <div className="mb-12 max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                  Survival Guide
                </p>
                <h2 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
                  Living here, day one onward
                </h2>
                <p className="mt-4 text-base leading-relaxed text-brand-charcoal-light sm:text-lg">
                  Field-tested, kept current. The shortcuts that save you
                  thousands of rupiah and a few headaches.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {practicalGuides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    variant="practical"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state when nothing is published */}
          {editorsPicks.length === 0 &&
            intentGuides.length === 0 &&
            practicalGuides.length === 0 && (
              <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
                <p className="text-lg text-brand-charcoal-light">
                  Guides are being written. Check back soon.
                </p>
              </section>
            )}

          {/* Quiz nudge */}
          <section className="border-t border-brand-gold/15 bg-brand-deep-green/5 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                Not sure where to start?
              </p>
              <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
                Take the quiz, find your guides.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-charcoal-light">
                Five archetypes. A few questions. We&apos;ll point you at the
                guides — and the events, retreats, and humans — most likely to
                matter to you.
              </p>
              <Link
                href="/quiz"
                className="mt-8 inline-flex items-center gap-2 border-b border-brand-deep-green/40 pb-1 text-sm uppercase tracking-[0.18em] text-brand-deep-green transition-colors hover:border-brand-gold hover:text-primary"
              >
                Take the quiz
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </>
      )}

      {/* Always-on intent legend at the bottom for SEO + secondary navigation */}
      {!activeIntent && (
        <section className="border-t border-brand-gold/10 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
              {GUIDE_INTENTS.map((intent) => (
                <li key={intent.id}>
                  <Link
                    href={`/guides?intent=${intent.id}`}
                    className="text-brand-charcoal/70 transition-colors hover:text-brand-deep-green"
                  >
                    {intent.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
