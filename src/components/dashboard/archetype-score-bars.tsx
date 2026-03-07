import { ARCHETYPES, ARCHETYPE_IDS } from "@/lib/quiz-data";
import type { QuizScores } from "@/types";

interface ArchetypeScoreBarsProps {
  scores: QuizScores;
}

export function ArchetypeScoreBars({ scores }: ArchetypeScoreBarsProps) {
  const maxScore = Math.max(...Object.values(scores), 1);

  return (
    <div className="space-y-3">
      {ARCHETYPE_IDS.map((id) => {
        const archetype = ARCHETYPES[id];
        const score = scores[id];
        const percentage = Math.round((score / maxScore) * 100);

        return (
          <div key={id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{archetype.name}</span>
              <span className="text-muted-foreground">{score} pts</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-deep-green transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
