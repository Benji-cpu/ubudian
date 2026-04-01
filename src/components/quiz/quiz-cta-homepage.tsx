"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ARCHETYPES } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import type { ArchetypeId } from "@/types";

const STORAGE_KEY = "ubudian_quiz_result";

interface StoredResult {
  primary: ArchetypeId;
}

export function QuizCtaHomepage() {
  const [result, setResult] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setResult(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // Returning user: compact banner
  if (result) {
    const archetype = ARCHETYPES[result.primary];
    return (
      <div className="bg-brand-pale-green">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src={archetype.hero_image}
                alt={archetype.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div>
              <p className="text-sm text-brand-charcoal-light">Your Ubud Spirit</p>
              <p className="font-serif font-medium text-brand-deep-green">{archetype.name}</p>
            </div>
          </div>
          <Link
            href={`/quiz/results/${result.primary}`}
            className="text-sm font-semibold text-brand-deep-green underline underline-offset-4 hover:text-brand-gold"
          >
            View results
          </Link>
        </div>
      </div>
    );
  }

  // New user: full CTA
  return (
    <section className="bg-brand-pale-green px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
          90-Second Quiz
        </p>
        <h2 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
          Discover Your Ubud Spirit
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-charcoal-light">
          Seeker, Explorer, Creative, Connector, or Epicurean? Take the quiz
          and find out which corner of Ubud&apos;s conscious community has your name on it.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/quiz">Take the Quiz</Link>
        </Button>
      </div>
    </section>
  );
}
