"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    // Wait for exit animation before unmounting
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 ${
        closing ? "animate-slide-down" : "animate-slide-up"
      }`}
    >
      <div className="w-full max-w-md rounded-xl border border-brand-gold/20 bg-[#2C4A3E] p-5 shadow-2xl dark:bg-[#1A1A1A]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-serif text-lg font-medium text-brand-gold">
              New to Ubud?
            </p>
            <p className="mt-1 text-sm text-brand-cream/80">
              Take 90 seconds to find your vibe.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="mt-0.5 rounded-md p-1 text-brand-cream/60 transition-colors hover:bg-white/10 hover:text-brand-cream"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            asChild
            size="sm"
            className="bg-brand-gold text-brand-deep-green hover:bg-brand-gold/90"
          >
            <Link href="/quiz">Find My Fit</Link>
          </Button>
          <button
            onClick={dismiss}
            className="text-sm text-brand-cream/60 transition-colors hover:text-brand-cream"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
