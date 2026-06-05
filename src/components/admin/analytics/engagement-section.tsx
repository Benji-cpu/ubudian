import { Heart, Sparkles, Compass, BookOpen, Activity } from "lucide-react";
import { BarList, type BarListItem } from "./bar-list";
import { SectionCard } from "./section-card";

export interface EngagementSectionProps {
  topEvents: BarListItem[];
  topJourneys: BarListItem[];
  topGuides: BarListItem[];
  quizTotal: number;
  quizWithProfile: number;
  archetypes: BarListItem[];
}

export function EngagementSection({
  topEvents,
  topJourneys,
  topGuides,
  quizTotal,
  quizWithProfile,
  archetypes,
}: EngagementSectionProps) {
  const quizConversion =
    quizTotal > 0 ? Math.round((quizWithProfile / quizTotal) * 100) : 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-brand-deep-green" />
        <h2 className="text-lg font-semibold">Engagement</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Top saved events"
          icon={<Heart className="h-4 w-4" />}
          hint="Your highest-signal content — feature these in the newsletter & For You rail."
        >
          <BarList items={topEvents} emptyLabel="No saved events yet" />
        </SectionCard>

        <SectionCard
          title="Top saved retreats"
          icon={<Compass className="h-4 w-4" />}
          hint="Demand signal for journeys — surface popular ones on the experiences page."
        >
          <BarList items={topJourneys} emptyLabel="No saved retreats yet" />
        </SectionCard>

        <SectionCard
          title="Top saved guides"
          icon={<BookOpen className="h-4 w-4" />}
          hint="Which guides resonate — double down on those themes."
        >
          <BarList items={topGuides} emptyLabel="No saved guides yet" />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Quiz → signup funnel"
          icon={<Sparkles className="h-4 w-4" />}
          hint="Low conversion? Strengthen the 'save your archetype, create an account' CTA on the results page."
        >
          {quizTotal > 0 ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold tabular-nums">
                    {quizConversion}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quizWithProfile} of {quizTotal} quiz-takers became accounts
                  </p>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-deep-green"
                  style={{ width: `${Math.max(quizConversion, 2)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No quiz completions yet
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Archetype distribution"
          icon={<Compass className="h-4 w-4" />}
          hint="Which archetypes dominate the member base — skew curation toward them, fill gaps for the rest."
        >
          <BarList items={archetypes} emptyLabel="No archetypes assigned yet" />
        </SectionCard>
      </div>
    </section>
  );
}
