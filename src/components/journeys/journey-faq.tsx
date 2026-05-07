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
 * Per-journey FAQ. Six questions a real visitor genuinely has after reading
 * the day-by-day. Answers are mostly the same across journeys but a few
 * details (length, what's pinned vs flexible) shift per journey.
 */
export function JourneyFaq({ journey }: JourneyFaqProps) {
  const faqs = buildFaqs(journey);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">
          Before you book your flights
        </span>
        <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
          Practical questions, honestly answered
        </h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-serif text-base font-medium text-brand-deep-green">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-foreground/85">
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
  return [
    {
      q: "Is this a guided retreat or a self-led guide?",
      a: `For now, this is the guide — the recipe a knowledgeable friend would hand you. You move through the ${days} days at your own pace, on your own dates, using our pinned villas, restaurants, and practitioners alongside the live events from across Ubud. Insider members get a dashboard, daily nudges, and the soft-cohort layer that quietly connects you to others walking the same arc. A small handful of fully-bundled, fully-held cohorts run two or three times a year — capped, hand-curated, all-in price.`,
    },
    {
      q: "Where do I stay?",
      a: `Quiet, light-filled villas in Penestanan or Nyuh Kuning — neighbourhoods walking distance from the morning anchors and the welcome dinner restaurant. You book the villa yourself for now (we're choosy about partners and only list places we'd send our friends). For the cohort retreats, the villa is part of the bundle.`,
    },
    {
      q: "How much does this cost?",
      a: `The retreat itself — the guide, the curation — is free to read and follow. The real cost is the things you'd be doing anyway: ${days <= 3 ? "$200–600 across three days for accommodation and meals; $30–80 for an anchor ceremony or a closing massage." : "$80–200/night for the villa across the week; $200–500 total for the anchor ceremonies, dance, dinners, and a closing massage."} Fully-bundled cohorts (when they run) are $500–1500 per person all-in.`,
    },
    {
      q: "Can I do this on my own dates?",
      a: `Yes — that's the point of the Living Guide format. The day-by-day is a flexible recipe. The system pulls real upcoming events from the calendar and matches them to whatever week you arrive. If a key ceremony only runs on Thursdays, you'll see Thursday's options. Insider self-paced (later this season) tracks state — you start whenever, mark days as done, and the soft cohort surfaces other people doing the same week.`,
    },
    {
      q: "What if I want to do just one day?",
      a: `Pull the thread. Each day's anchor is a real bookable experience in Ubud — a ceremony, a class, a temple morning. You don't need to commit to the whole retreat to use the single recommendation. The journey works as a cohesive arc; it also works as an à-la-carte pick.`,
    },
    {
      q: "How do I meet the others on this retreat?",
      a: `Soft cohort opens with the Insider tier later this season — anyone walking the same retreat in Ubud the same week can opt into a small WhatsApp group plus a "who's on Day N right now" view (anonymous until both parties opt in). Self-selection does the work — you end up with people who chose the same arc you did.`,
    },
  ];
}
