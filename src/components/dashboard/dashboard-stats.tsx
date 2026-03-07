import { Sparkles, CalendarPlus, Heart } from "lucide-react";
import { ARCHETYPES } from "@/lib/quiz-data";
import type { ArchetypeId } from "@/types";

interface DashboardStatsProps {
  archetype: ArchetypeId | null;
  submittedCount: number;
  savedCount: number;
}

export function DashboardStats({
  archetype,
  submittedCount,
  savedCount,
}: DashboardStatsProps) {
  const archetypeData = archetype ? ARCHETYPES[archetype] : null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-brand-gold/10 bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-deep-green/10">
            <Sparkles className="h-5 w-5 text-brand-deep-green" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ubud Spirit</p>
            <p className="font-serif text-lg font-medium">
              {archetypeData ? archetypeData.name : "Not taken yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-brand-gold/10 bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-terracotta/10">
            <CalendarPlus className="h-5 w-5 text-brand-terracotta" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Events Submitted</p>
            <p className="font-serif text-lg font-medium">{submittedCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-brand-gold/10 bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10">
            <Heart className="h-5 w-5 text-brand-gold" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saved Events</p>
            <p className="font-serif text-lg font-medium">{savedCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
