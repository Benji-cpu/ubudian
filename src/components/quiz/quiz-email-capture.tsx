"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { UserSegment } from "@/types";

interface QuizEmailCaptureProps {
  onSubmit: (email: string) => void;
  onSkip: () => void;
  userSegment?: UserSegment | null;
}

export function QuizEmailCapture({ onSubmit, onSkip, userSegment }: QuizEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    onSubmit(email.toLowerCase().trim());
  }

  const subtitleText =
    userSegment === "curious"
      ? "Enter your email to get a personalized Ubud guide matched to your spirit"
      : "Save your results and get events matched to your archetype in the weekly newsletter.";

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-2 text-4xl">&#10024;</div>
      <h2 className="font-serif text-2xl font-medium text-brand-charcoal sm:text-3xl">
        Your Ubud Spirit is ready!
      </h2>
      <p className="mt-4 text-lg text-brand-charcoal-light">
        {subtitleText}
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "See My Results"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </form>

      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-sm text-brand-charcoal-light underline underline-offset-4 hover:text-brand-charcoal"
      >
        Skip — show my results
      </button>
    </div>
  );
}
