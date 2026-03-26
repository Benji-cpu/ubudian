"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { QUIZ_QUESTIONS, calculateArchetypeScores, ARCHETYPES, ARCHETYPE_IDS } from "@/lib/quiz-data";
import { QuizProgress } from "./quiz-progress";
import { QuizQuestion } from "./quiz-question";
import { QuizEmailCapture } from "./quiz-email-capture";
import { QuizResults } from "./quiz-results";
import { QuizArchetypeCard } from "./quiz-archetype-card";
import { Button } from "@/components/ui/button";
import type { ArchetypeId, QuizScores, Event, Tour, Story, Experience } from "@/types";

const STORAGE_KEY = "ubudian_quiz_result";

type Step = "intro" | "questions" | "email" | "results";

interface StoredResult {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  scores: QuizScores;
  answers: { question_id: number; answer_id: string }[];
  completedAt: string;
  email?: string;
}

interface QuizContainerProps {
  events: Event[];
  tours: Tour[];
  stories: Story[];
  experiences: Experience[];
}

export function QuizContainer({ events, tours, stories, experiences }: QuizContainerProps) {
  const [step, setStep] = useState<Step>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: number; answer_id: string }[]>([]);
  const [result, setResult] = useState<{ primary: ArchetypeId; secondary: ArchetypeId; scores: QuizScores } | null>(null);

  // Check for stored result on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredResult = JSON.parse(stored);
        setResult({
          primary: parsed.primary,
          secondary: parsed.secondary,
          scores: parsed.scores,
        });
        setAnswers(parsed.answers);
        setStep("results");
      }
    } catch {
      // ignore
    }
  }, []);

  const submitToServer = useCallback(
    async (
      computed: { primary: ArchetypeId; secondary: ArchetypeId; scores: QuizScores },
      userAnswers: { question_id: number; answer_id: string }[],
      email?: string
    ) => {
      try {
        await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            primary_archetype: computed.primary,
            secondary_archetype: computed.secondary,
            scores: computed.scores,
            answers: userAnswers,
            email,
          }),
        });
      } catch {
        // graceful fallback — results are in localStorage
      }
    },
    []
  );

  function handleAnswer(answerId: string) {
    const question = QUIZ_QUESTIONS[currentQuestion];
    const newAnswers = [...answers, { question_id: question.id, answer_id: answerId }];
    setAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // All questions answered — calculate and go to email capture
      const computed = calculateArchetypeScores(newAnswers);
      setResult(computed);
      setStep("email");
    }
  }

  function handleEmailSubmit(email: string) {
    if (!result) return;

    const stored: StoredResult = {
      ...result,
      answers,
      completedAt: new Date().toISOString(),
      email,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    submitToServer(result, answers, email);
    setStep("results");
  }

  function handleEmailSkip() {
    if (!result) return;

    const stored: StoredResult = {
      ...result,
      answers,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    submitToServer(result, answers);
    setStep("results");
  }

  function handleRetake() {
    localStorage.removeItem(STORAGE_KEY);
    setStep("intro");
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
  }

  // ---- Render ----

  if (step === "results" && result) {
    return (
      <QuizResults
        primary={result.primary}
        secondary={result.secondary}
        scores={result.scores}
        events={events}
        tours={tours}
        stories={stories}
        experiences={experiences}
        onRetake={handleRetake}
      />
    );
  }

  if (step === "email") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <QuizEmailCapture onSubmit={handleEmailSubmit} onSkip={handleEmailSkip} />
      </div>
    );
  }

  if (step === "questions") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <QuizProgress current={currentQuestion + 1} total={QUIZ_QUESTIONS.length} />
        <div key={QUIZ_QUESTIONS[currentQuestion].id}>
          <QuizQuestion
            question={QUIZ_QUESTIONS[currentQuestion]}
            onAnswer={handleAnswer}
          />
        </div>
      </div>
    );
  }

  // Intro
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
        90-Second Quiz
      </p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-brand-charcoal sm:text-5xl">
        Discover Your Ubud Spirit
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-brand-charcoal-light">
        Answer 6 questions and we&apos;ll match you to one of 5 archetypes — then
        show you the ceremonies, workshops, tours, and stories that match your path.
      </p>

      <Button size="lg" className="mt-8" onClick={() => setStep("questions")}>
        Start the Quiz
      </Button>

      {/* Explore all archetypes */}
      <div className="mt-16">
        <h2 className="font-serif text-2xl font-medium text-brand-charcoal">
          The 5 Ubud Spirits
        </h2>
        <p className="mt-2 text-brand-charcoal-light">
          Or explore them all — no quiz required.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHETYPE_IDS.map((id) => (
            <QuizArchetypeCard key={id} archetype={ARCHETYPES[id]} />
          ))}
        </div>
      </div>

      <p className="mt-12 text-sm text-brand-charcoal-light/60">
        Already taken the quiz?{" "}
        <Link href="/quiz/results/seeker" className="inline-block py-2 underline underline-offset-2 hover:text-brand-charcoal-light">
          Browse archetype pages
        </Link>
      </p>
    </div>
  );
}
