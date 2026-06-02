import Link from "next/link";
import { ARCHETYPES, ARCHETYPE_IDS } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import type { ArchetypeId } from "@/types";

/**
 * Lightweight, reusable "find your spirit" explainer + CTA.
 *
 * Answers the first-time visitor's question — "what are these archetypes and
 * where do I navigate?" — without making them feel they have to already KNOW
 * which one they are. The quiz reveals it; this just frames the five and points
 * at it. Two shapes:
 *   - `strip`: a slim orientation band for the top of a feed (e.g. /events),
 *     shown only to visitors who haven't taken the quiz yet.
 *   - `grid`: a fuller five-card panel for a section break (homepage, etc.).
 *
 * Copy lives in `ARCHETYPES` (quiz-data.ts) — never duplicated here.
 */

// Static accent map — Tailwind can't safely compose `bg-${token}` at runtime,
// so the archetype colours are spelled out. Mirrors `ARCHETYPES[id].color`.
const ACCENT_DOT: Record<ArchetypeId, string> = {
  seeker: "bg-brand-deep-green",
  explorer: "bg-brand-deep-green",
  creative: "bg-brand-gold",
  connector: "bg-brand-terracotta",
  epicurean: "bg-brand-terracotta",
};

function shortName(name: string): string {
  return name.replace(/^The\s+/i, "");
}

interface ArchetypeExplainerProps {
  variant?: "strip" | "grid";
  className?: string;
}

export function ArchetypeExplainer({
  variant = "strip",
  className = "",
}: ArchetypeExplainerProps) {
  if (variant === "grid") {
    return (
      <section className={`mx-auto max-w-5xl px-4 sm:px-6 ${className}`}>
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
            Five ways into Ubud
          </span>
          <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold sm:text-3xl">
            You don&apos;t have to know which one you are
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-foreground/70">
            Everyone moves through the valley differently. The 90-second quiz
            finds your spirit, then tunes your events, journeys, and the people
            we&apos;d introduce you to first.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHETYPE_IDS.map((id) => {
            const a = ARCHETYPES[id];
            return (
              <div
                key={id}
                className="rounded-xl border border-brand-gold/20 bg-card p-5"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ACCENT_DOT[id]}`} />
                  <h3 className="font-serif text-lg text-brand-deep-green dark:text-brand-gold">
                    {a.name}
                  </h3>
                </div>
                <p className="mt-2 text-sm italic leading-relaxed text-foreground/70">
                  {a.tagline}
                </p>
              </div>
            );
          })}
          <div className="flex items-center justify-center rounded-xl border border-dashed border-brand-gold/30 bg-brand-gold/5 p-5">
            <Button asChild>
              <Link href="/quiz">Discover your spirit</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // strip — slim band, keeps the agenda close to the fold
  return (
    <div
      className={`rounded-xl border border-brand-gold/20 bg-card px-4 py-4 sm:px-6 ${className}`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="text-[0.7rem] uppercase tracking-[0.25em] text-brand-gold">
            New here
          </span>
          <p className="mt-1 font-serif text-lg leading-snug text-brand-deep-green dark:text-brand-gold">
            Every gathering in the valley — tuned to your spirit.
          </p>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-foreground/70">
            Five ways people move through Ubud. Find yours and the feed — plus
            your curated journeys — reshape around it.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {ARCHETYPE_IDS.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 text-xs text-foreground/75"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${ACCENT_DOT[id]}`} />
                {shortName(ARCHETYPES[id].name)}
              </span>
            ))}
          </div>
        </div>
        <Button asChild className="shrink-0 self-start sm:self-auto">
          <Link href="/quiz">Take the 90-second quiz</Link>
        </Button>
      </div>
    </div>
  );
}
