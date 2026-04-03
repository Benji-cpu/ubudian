"use client";

import { useState } from "react";
import { ROUTER_QUESTION } from "@/lib/quiz-data";
import type { UserSegment } from "@/types";

interface QuizRouterQuestionProps {
  onSelect: (segment: UserSegment) => void;
}

export function QuizRouterQuestion({ onSelect }: QuizRouterQuestionProps) {
  const [selected, setSelected] = useState<UserSegment | null>(null);

  function handleSelect(segment: UserSegment) {
    if (selected) return;
    setSelected(segment);
    setTimeout(() => onSelect(segment), 400);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-center font-serif text-xl font-medium text-brand-charcoal sm:text-2xl">
        {ROUTER_QUESTION.question}
      </h2>
      <div className="space-y-3">
        {ROUTER_QUESTION.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-all duration-300 ${
              selected === option.id
                ? "border-brand-gold bg-brand-gold/10 text-brand-charcoal"
                : selected
                  ? "border-brand-cream/50 bg-white/50 text-brand-charcoal-light/50"
                  : "border-brand-cream bg-white text-brand-charcoal hover:border-brand-gold/50 hover:bg-brand-gold/5"
            }`}
          >
            <span className="text-base font-medium leading-relaxed">{option.label}</span>
            <span className="mt-1 block text-sm text-brand-charcoal-light">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
