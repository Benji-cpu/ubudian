"use client";

import { useState } from "react";
import Image from "next/image";
import type { QuizQuestion as QuizQuestionType } from "@/types";

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (answerId: string) => void;
}

export function QuizQuestion({ question, onAnswer }: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(answerId: string) {
    if (selected) return;
    setSelected(answerId);
    setTimeout(() => onAnswer(answerId), 400);
  }

  if (question.type === "image") {
    return (
      <div>
        <h2 className="mb-4 text-center font-serif text-xl font-medium text-brand-charcoal sm:text-2xl">
          {question.question}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {question.answers.map((answer) => (
            <button
              key={answer.id}
              onClick={() => handleSelect(answer.id)}
              className={`group relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                selected === answer.id
                  ? "border-brand-gold ring-2 ring-brand-gold/30"
                  : selected
                    ? "border-transparent opacity-40"
                    : "border-transparent hover:border-brand-gold/50"
              }`}
            >
              <Image
                src={answer.image_url || "/images/quiz/placeholder.jpg"}
                alt={answer.text}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-left text-sm font-medium leading-tight text-white sm:text-base">
                {answer.text}
              </span>
              {selected === answer.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-gold/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Text-based question
  return (
    <div>
      <h2 className="mb-4 text-center font-serif text-xl font-medium text-brand-charcoal sm:text-2xl">
        {question.question}
      </h2>
      <div className="mx-auto max-w-lg space-y-2">
        {question.answers.map((answer) => (
          <button
            key={answer.id}
            onClick={() => handleSelect(answer.id)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-300 ${
              selected === answer.id
                ? "border-brand-gold bg-brand-gold/10 text-brand-charcoal"
                : selected
                  ? "border-brand-cream/50 bg-card/50 text-brand-charcoal-light/50"
                  : "border-brand-cream bg-card text-brand-charcoal hover:border-brand-gold/50 hover:bg-brand-gold/5"
            }`}
          >
            <span className="text-base leading-relaxed">{answer.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
