import { Mail, Sprout, Radio } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { Sparkline } from "./sparkline";
import { BarList, type BarListItem } from "./bar-list";
import { SectionCard } from "./section-card";

export interface GrowthSectionProps {
  newsletterTotal: number;
  newsletterSeries: number[];
  signupsBySource: BarListItem[];
}

export function GrowthSection({
  newsletterTotal,
  newsletterSeries,
  signupsBySource,
}: GrowthSectionProps) {
  const newSubs90d = newsletterSeries.reduce((a, b) => a + b, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sprout className="h-4 w-4 text-brand-deep-green" />
        <h2 className="text-lg font-semibold">Growth</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <KpiCard
          label="Newsletter subscribers"
          value={newsletterTotal}
          sublabel={`${newSubs90d} new in 90 days`}
          icon={<Mail className="h-4 w-4" />}
          href="/admin/community"
        />

        <div className="lg:col-span-2">
          <SectionCard
            title="Newsletter growth — last 90 days"
            icon={<Mail className="h-4 w-4" />}
            hint="The list is the warmest re-engagement channel — keep it growing."
          >
            {newSubs90d > 0 ? (
              <Sparkline points={newsletterSeries} tone="gold" />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No new subscribers in the last 90 days
              </p>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Signups by source"
        icon={<Radio className="h-4 w-4" />}
        hint="Which acquisition channels actually convert — double down on the leaders, cut the dead ones."
      >
        <BarList
          items={signupsBySource}
          tone="gold"
          emptyLabel="No subscriber sources recorded yet"
        />
      </SectionCard>
    </section>
  );
}
