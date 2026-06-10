"use client";

import { useState, useEffect, useCallback } from "react";
import { QUIZ_QUESTIONS, calculateArchetypeScores } from "@/lib/quiz-data";
import { QuizProgress } from "./quiz-progress";
import { QuizQuestion } from "./quiz-question";
import { QuizEmailCapture } from "./quiz-email-capture";
import { QuizResults } from "./quiz-results";
import { QuizImmersiveShell } from "./quiz-immersive-shell";
import { QuizRouterQuestion } from "./quiz-router-question";
import { Button } from "@/components/ui/button";
import type { ArchetypeId, QuizScores, Event, Tour, Story, Experience, UserSegment } from "@/types";

const STORAGE_KEY = "ubudian_quiz_result";

type Step = "intro" | "router" | "questions" | "email" | "results";

interface StoredResult {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  scores: QuizScores;
  answers: { question_id: number; answer_id: string }[];
  completedAt: string;
  email?: string;
  userSegment?: UserSegment;
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
  const [userSegment, setUserSegment] = useState<UserSegment | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);

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
        if (parsed.userSegment) {
          setUserSegment(parsed.userSegment);
        }
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
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            primary_archetype: computed.primary,
            secondary_archetype: computed.secondary,
            scores: computed.scores,
            answers: userAnswers,
            email,
            user_segment: userSegment,
          }),
        });
        if (!res.ok) {
          console.warn(`[quiz] submit failed with status ${res.status}`);
          setSubmitFailed(true);
        }
      } catch {
        // graceful fallback — results are in localStorage
        setSubmitFailed(true);
      }
    },
    [userSegment]
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
      userSegment: userSegment || undefined,
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
      userSegment: userSegment || undefined,
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
    setUserSegment(null);
    setSubmitFailed(false);
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
        userSegment={userSegment}
        submitFailed={submitFailed}
      />
    );
  }

  if (step === "email") {
    return (
      <QuizImmersiveShell>
        <QuizEmailCapture onSubmit={handleEmailSubmit} onSkip={handleEmailSkip} userSegment={userSegment} />
      </QuizImmersiveShell>
    );
  }

  if (step === "router") {
    return (
      <QuizImmersiveShell>
        <QuizRouterQuestion onSelect={(segment) => {
          setUserSegment(segment);
          setStep("questions");
        }} />
      </QuizImmersiveShell>
    );
  }

  if (step === "questions") {
    return (
      <QuizImmersiveShell>
        <div className="w-full max-w-2xl">
          <QuizProgress current={currentQuestion + 1} total={QUIZ_QUESTIONS.length} />
          <div key={QUIZ_QUESTIONS[currentQuestion].id}>
            <QuizQuestion
              question={QUIZ_QUESTIONS[currentQuestion]}
              onAnswer={handleAnswer}
            />
          </div>
        </div>
      </QuizImmersiveShell>
    );
  }

  // Intro
  return (
    <QuizImmersiveShell>
      <div className="max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
          90-Second Quiz
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-brand-charcoal sm:text-5xl">
          Discover Your Ubud Spirit
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-brand-charcoal-light">
          Answer 5 questions and we&apos;ll match you to one of 5 Ubud
          archetypes — then show you the events, tours, and stories that fit.
        </p>

        <Button size="lg" className="mt-8" onClick={() => setStep("router")}>
          Start the Quiz
        </Button>
      </div>
    </QuizImmersiveShell>
  );
}
