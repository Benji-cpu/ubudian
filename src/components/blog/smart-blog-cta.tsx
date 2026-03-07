"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ARCHETYPES } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import type { ArchetypeId } from "@/types";

const QUIZ_KEY = "ubudian_quiz_result";
const SUBSCRIBED_KEY = "ubudian_subscribed";

interface StoredQuizResult {
  primary: ArchetypeId;
}

function ShareButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-deep-green/20 px-3 py-1.5 text-xs font-medium text-brand-deep-green transition-colors hover:bg-brand-deep-green hover:text-white"
    >
      {label}
    </a>
  );
}

export function SmartBlogCta() {
  const [quizResult, setQuizResult] = useState<StoredQuizResult | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedQuiz = localStorage.getItem(QUIZ_KEY);
      if (storedQuiz) {
        setQuizResult(JSON.parse(storedQuiz));
      }
      const storedSub = localStorage.getItem(SUBSCRIBED_KEY);
      if (storedSub === "true") {
        setSubscribed(true);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl" />
      </section>
    );
  }

  // State C: Quiz taken AND subscribed
  if (quizResult && subscribed) {
    const archetype = ARCHETYPES[quizResult.primary];
    const shareUrl = encodeURIComponent("https://theubudian.com");
    const shareText = encodeURIComponent(
      "Discover Ubud's events, stories, and community — The Ubudian"
    );

    return (
      <section className="bg-brand-pale-green px-4 py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
            <Image
              src={archetype.hero_image}
              alt={archetype.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-brand-charcoal-light">
              Thanks for being part of The Ubudian community
            </p>
            <p className="font-serif font-medium text-brand-deep-green">
              {archetype.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/quiz/results/${quizResult.primary}`}
              className="text-sm font-semibold text-brand-deep-green underline underline-offset-4 hover:text-brand-gold"
            >
              View results
            </Link>
            <span className="text-brand-charcoal-light/30">|</span>
            <ShareButton
              label="WhatsApp"
              href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
            />
            <ShareButton
              label="X"
              href={`https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            />
          </div>
        </div>
      </section>
    );
  }

  // State B: Quiz taken, NOT subscribed
  if (quizResult && !subscribed) {
    const archetype = ARCHETYPES[quizResult.primary];

    return (
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src={archetype.hero_image}
                alt={archetype.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <span className="font-serif font-medium text-brand-deep-green">
              {archetype.name}
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            As {archetype.name === "The Explorer" || archetype.name === "The Epicurean" || archetype.name === "The Connector" || archetype.name === "The Creative" || archetype.name === "The Seeker" ? "a" : "a"}{" "}
            {archetype.name}, you&apos;ll love our weekly guide
          </h2>
          <p className="mt-2 text-muted-foreground">
            Events, stories, and tips curated for your Ubud spirit — delivered
            every week.
          </p>
          <NewsletterSignup className="mx-auto mt-6 max-w-md" />
        </div>
      </section>
    );
  }

  // State A: New visitor (no quiz, not subscribed)
  return (
    <section className="bg-brand-pale-green px-4 py-14">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
          Interactive Quiz
        </p>
        <h2 className="mt-3 font-serif text-2xl font-bold text-brand-deep-green">
          Discover Your Ubud Spirit
        </h2>
        <p className="mt-2 text-muted-foreground">
          Are you a Seeker, Explorer, Creative, Connector, or Epicurean? Take
          our 90-second quiz and get personalized recommendations.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/quiz">Take the Quiz</Link>
        </Button>

        <div className="mt-8 border-t border-brand-deep-green/10 pt-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Or subscribe to our weekly newsletter
          </p>
          <NewsletterSignup className="mx-auto max-w-md" />
        </div>
      </div>
    </section>
  );
}
