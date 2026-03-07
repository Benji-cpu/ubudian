"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface QuizEmailCaptureProps {
  onSubmit: (email: string) => void;
  onSkip: () => void;
}

export function QuizEmailCapture({ onSubmit, onSkip }: QuizEmailCaptureProps) {
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

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-2 text-4xl">&#10024;</div>
      <h2 className="font-serif text-3xl font-medium text-brand-charcoal sm:text-4xl">
        Your Ubud Spirit is ready!
      </h2>
      <p className="mt-4 text-lg text-brand-charcoal-light">
        Enter your email to save your results and get personalized Ubud
        recommendations in our weekly newsletter.
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "See My Results"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </form>

      <button
        onClick={onSkip}
        className="mt-4 text-sm text-brand-charcoal-light/60 underline underline-offset-2 transition-colors hover:text-brand-charcoal-light"
      >
        Skip and see results
      </button>
    </div>
  );
}
