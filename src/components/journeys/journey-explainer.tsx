import { ScrollReveal } from "@/components/ui/scroll-reveal";

/**
 * Disambiguates the two things first-time visitors conflate about journeys:
 *   1. LENGTH — what a 3-day vs a 7-day actually is.
 *   2. MODE — Signature Cohort (hosted, fixed dates) vs Living Guide (free,
 *      self-serve, same recipe).
 *
 * Sits between the differentiator strip and the cohort grid on /experiences.
 * Deliberately scannable — two compact cards, not prose.
 */
export function JourneyExplainer() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <ScrollReveal>
        <div className="mb-8 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
            Before you choose
          </span>
          <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
            What a journey actually is
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-foreground/70">
            A journey is a curated multi-day thread through the scene — the
            practitioners, circles, and tables we&apos;d open for you. Two things
            to know before you pick one.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Axis 1 — length */}
        <ScrollReveal>
          <div className="h-full rounded-2xl border border-brand-gold/20 bg-card p-6 sm:p-7">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">
              How long
            </span>
            <h3 className="mt-2 font-serif text-xl font-medium text-brand-deep-green">
              Three days, or seven
            </h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-serif text-base italic text-brand-deep-green">
                  The 3-day reset
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-foreground/70">
                  One clear arc — arrive, drop in, leave lighter. A long weekend
                  that gives you a true taste of the scene without rearranging
                  your life.
                </dd>
              </div>
              <div>
                <dt className="font-serif text-base italic text-brand-deep-green">
                  The 7-day immersion
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-foreground/70">
                  A fuller week — more practitioners, more rest built in, the
                  valley revealed at its own pace. Space to let something
                  actually shift.
                </dd>
              </div>
            </dl>
          </div>
        </ScrollReveal>

        {/* Axis 2 — mode */}
        <ScrollReveal delayMs={120}>
          <div className="h-full rounded-2xl border border-brand-gold/20 bg-card p-6 sm:p-7">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">
              How you travel it
            </span>
            <h3 className="mt-2 font-serif text-xl font-medium text-brand-deep-green">
              Hosted, or self-serve
            </h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-serif text-base italic text-brand-deep-green">
                  Signature Cohort
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-foreground/70">
                  Hosted. Fixed dates, four to eight people, villa and meals
                  sorted, introductions made in person. This is where we open the
                  doors for you.
                </dd>
              </div>
              <div>
                <dt className="font-serif text-base italic text-brand-deep-green">
                  Living Guide
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-foreground/70">
                  Free and self-serve. The same curated itinerary, yours to
                  follow — you handle the villa and the bookings. A soft start
                  whenever your dates don&apos;t line up with a cohort.
                </dd>
              </div>
            </dl>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
