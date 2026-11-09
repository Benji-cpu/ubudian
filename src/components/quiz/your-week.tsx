import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { yourWeekHeading } from "@/lib/events/timetable";
import type { Event } from "@/types";

/**
 * "Your week in Ubud" on a quiz result: up to five events that match the
 * archetype, spread over the next seven days (from `nextForArchetype()`),
 * with the weekly email right under them, where the reader has just seen what
 * it would bring. A reader who left their email in the quiz is already on the
 * list and is told so.
 */
export function YourWeek({ archetypeName, events, subscribed = false }: { archetypeName: string; events: Event[]; subscribed?: boolean }) {
  const heading = yourWeekHeading(events);
  return (
    <section>
      <h2 className="font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-gold sm:text-3xl">{heading.title}</h2>
      <p className="mt-2 text-muted-foreground">
        {events.length > 0
          ? `${heading.line} Times are Bali time.`
          : `Nothing for ${archetypeName} is listed in the next seven days yet. New events are added every night.`}
      </p>

      {events.length > 0 ? (
        <div className="mt-6 space-y-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-5">
        {subscribed ? (
          <p className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-deep-green dark:text-brand-gold" aria-hidden />
            You&apos;re on the list. Your week&apos;s picks arrive every Wednesday.
          </p>
        ) : (
          <>
            <p className="font-medium text-foreground">Get your week&apos;s picks every Wednesday. Free.</p>
            <NewsletterSignup source="quiz_result" className="mt-3" />
          </>
        )}
      </div>

      <Link
        href="/ubud-events-this-week"
        className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-brand-deep-green underline-offset-4 hover:underline dark:text-brand-gold"
      >
        Everything on in Ubud this week
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
