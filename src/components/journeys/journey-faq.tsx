import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Journey } from "@/types";

interface JourneyFaqProps {
  journey: Journey;
}

/**
 * Per-journey FAQ. Six questions someone considering a paid retreat genuinely
 * wants answered — about price, about who they'll meet, about coming alone,
 * and about how the application gate works.
 */
export function JourneyFaq({ journey }: JourneyFaqProps) {
  const faqs = buildFaqs(journey);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
          Before you apply
        </span>
        <h2 className="mt-3 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
          Honest questions, honestly answered
        </h2>
      </div>
      <Accordion type="single" collapsible className="w-full divide-y divide-brand-gold/20 border-t border-b border-brand-gold/20 [&_[data-slot=accordion-item]]:border-0 [&_[data-state=open]]:bg-brand-cream/35">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="px-1 transition-colors data-[state=open]:border-l-2 data-[state=open]:border-l-brand-deep-green data-[state=open]:pl-4"
          >
            <AccordionTrigger className="py-5 text-left font-serif text-base font-medium leading-snug text-brand-deep-green hover:no-underline data-[state=open]:text-brand-deep-green sm:text-lg [&>svg]:hidden">
              <span className="flex flex-1 items-baseline justify-between gap-4">
                <span>{faq.q}</span>
                <span
                  aria-hidden="true"
                  className="relative ml-4 flex h-4 w-4 shrink-0 self-center"
                >
                  {/* gold hairline cross — vertical hides when accordion is open */}
                  <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-brand-gold" />
                  <span className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-brand-gold transition-transform duration-300 [[data-state=open]_&]:scale-y-0" />
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-6 pr-4 text-base leading-relaxed text-foreground/80">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function buildFaqs(journey: Journey): { q: string; a: string }[] {
  const days = journey.length_days;
  const isShort = days <= 3;
  return [
    {
      q: "Why is it priced where it is?",
      a: `You're not paying for a curriculum. You're paying for the people. ${isShort ? "$1,400–1,800 per person" : "$2,400–3,400 per person"} covers the villa, the meals, the transfers, and — the part that matters — the introductions: practitioners we've worked with for years, gatherings that don't take strangers, tables you wouldn't be invited to alone. Comparable Ubud retreats sell the same villa-and-classes for more. We're priced where the conscious-community scene actually lives, not where wellness tourism does.`,
    },
    {
      q: "Will I actually meet the community, or just attend a program?",
      a: `That's the whole point of the format. Each day's anchor is a person, place, or circle. A healer comes to the villa for a private session, then stays for tea. A cacao circle in someone's living room — you're a guest, not a customer. A long-stayer hosts dinner and you meet five Ubudians who actually live here. By day five most cohorts have a small WhatsApp thread that keeps going long after the week ends. You leave with phone numbers, not just photographs.`,
    },
    {
      q: "What if I'm coming alone?",
      a: `Most people do. The cohort caps at four to eight, hand-picked for fit — we read every application. You arrive among strangers; the design of the week (shared meals, small rituals, real rest) means you don't stay strangers. If "alone" means "shy about group dynamics," say that on the application — we work with it.`,
    },
    {
      q: "Is this a yoga retreat?",
      a: `No. Yoga is on every corner in Ubud, and if you want a yoga-heavy week, the studios in town do that better than we ever could. This is a different shape: ${isShort ? "three days" : "a week"} of relational access into the conscious community — ceremony, breathwork, sound, embodiment, and the long meals where the actual conversations happen. If a class fits a day, fine. The class isn't the point.`,
    },
    {
      q: "Solo or with a partner?",
      a: `Both work. Most cohorts run a mix — solo travellers in private rooms, couples in shared rooms. Pricing differs slightly (single occupancy vs shared villa room). If you're applying as a couple, mention the relational work you're after; some weeks are explicitly for couples, others are mixed.`,
    },
    {
      q: "How does the application work?",
      a: `Tell us a bit about who you are and what's drawing you to this particular week. We read every one. Within three days we'll either send you the payment link to hold a place, suggest a different week, or — if the fit isn't there — say so plainly. The application is what protects the cohort dynamic; it's not a sales filter.`,
    },
  ];
}
