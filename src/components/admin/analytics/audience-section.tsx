import { Users, UserPlus, LogIn, BadgeCheck, TrendingUp } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { Sparkline } from "./sparkline";
import { SectionCard } from "./section-card";

export interface AudienceSectionProps {
  totalAccounts: number;
  activeMembers: number;
  logins7d: number;
  newSignups30d: number;
  onboardingCompleted: number;
  accountsSeries: number[];
  loginStats: {
    active_1d: number;
    active_7d: number;
    active_30d: number;
    never_signed_in: number;
  };
}

export function AudienceSection({
  totalAccounts,
  activeMembers,
  logins7d,
  newSignups30d,
  onboardingCompleted,
  accountsSeries,
  loginStats,
}: AudienceSectionProps) {
  const onboardingPct =
    totalAccounts > 0
      ? Math.round((onboardingCompleted / totalAccounts) * 100)
      : 0;
  const accounts30d = accountsSeries.reduce((a, b) => a + b, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-brand-deep-green" />
        <h2 className="text-lg font-semibold">Audience</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total accounts"
          value={totalAccounts}
          sublabel={`${onboardingPct}% completed welcome`}
          icon={<Users className="h-4 w-4" />}
          href="/admin/community"
        />
        <KpiCard
          label="Active members"
          value={activeMembers}
          sublabel="Paying subscribers"
          icon={<BadgeCheck className="h-4 w-4" />}
          valueClassName={
            activeMembers > 0 ? "text-brand-deep-green" : undefined
          }
          href="/admin/commerce"
        />
        <KpiCard
          label="Logins (7d)"
          value={logins7d}
          sublabel={`${loginStats.active_1d} today · ${loginStats.active_30d} in 30d`}
          icon={<LogIn className="h-4 w-4" />}
        />
        <KpiCard
          label="New signups (30d)"
          value={newSignups30d}
          sublabel={`${accounts30d} accounts created`}
          icon={<UserPlus className="h-4 w-4" />}
        />
      </div>

      <SectionCard
        title="Accounts created — last 30 days"
        icon={<TrendingUp className="h-4 w-4" />}
        hint="Flat or falling? The acquisition funnel (quiz, newsletter, social) needs attention."
      >
        {accounts30d > 0 ? (
          <Sparkline points={accountsSeries} />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No new accounts in the last 30 days
          </p>
        )}
      </SectionCard>
    </section>
  );
}
