"use client";

interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-4">
      <div className="mb-2 text-center text-sm text-brand-charcoal-light">
        <span>
          Question {current} of {total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-cream">
        <div
          className="h-full rounded-full bg-brand-gold transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
