"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const RESULT_KEY = "ubudian_quiz_result";
const DISMISSED_KEY = "ubudian_quiz_dismissed";
const DELAY_MS = 5000;

export function QuizPrompt() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    try {
      const hasResult = localStorage.getItem(RESULT_KEY);
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (hasResult || dismissed) return;
    } catch {
      return;
    }

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setClosing(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:pb-6 ${
        closing ? "animate-slide-down" : "animate-slide-up"
      }`}
      role="dialog"
      aria-labelledby="quiz-prompt-heading"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-brand-charcoal/10 bg-brand-cream shadow-[0_20px_60px_-20px_rgba(44,74,62,0.35)] dark:border-brand-gold/15 dark:bg-[#1A1A1A] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-brand-charcoal/40 transition-colors hover:bg-brand-charcoal/5 hover:text-brand-charcoal dark:text-brand-cream/40 dark:hover:bg-brand-cream/5 dark:hover:text-brand-cream"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="px-6 pb-6 pt-7">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-brand-gold" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-terracotta">
              New here?
            </span>
          </div>

          <h2
            id="quiz-prompt-heading"
            className="mt-3 font-serif text-xl leading-tight text-brand-deep-green dark:text-brand-gold"
          >
            Find your kind of Ubud<span className="text-brand-gold">.</span>
          </h2>
          <p className="mt-1.5 text-sm text-brand-charcoal/70 dark:text-brand-cream/70">
            Six questions. Ninety seconds. We&rsquo;ll point you to the places, people and
            moments that fit you.
          </p>

          <div className="mt-5 flex items-center gap-5">
            <Link
              href="/quiz"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-full bg-brand-deep-green px-5 py-2.5 text-sm font-medium text-brand-cream transition-colors hover:bg-brand-deep-green/90 dark:bg-brand-gold dark:text-brand-deep-green dark:hover:bg-brand-gold/90"
            >
              Take the quiz
            </Link>
            <button
              onClick={dismiss}
              className="text-sm text-brand-charcoal/55 transition-colors hover:text-brand-charcoal dark:text-brand-cream/55 dark:hover:text-brand-cream"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
