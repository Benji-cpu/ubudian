import { Badge } from "@/components/ui/badge";
import type { Sponsor } from "@/types";

interface Props {
  impressions: number;
  profileViews: number;
  clicks: number;
  sponsor: Pick<Sponsor, "stripe_subscription_status" | "stripe_subscription_id" | "claimed_by_profile_id">;
}

export function SponsorAnalyticsCard({ impressions, profileViews, clicks, sponsor }: Props) {
  return (
    <section className="rounded-md border border-brand-gold/20 bg-brand-cream/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg text-brand-deep-green">
          Last 30 days
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {sponsor.claimed_by_profile_id ? (
            <Badge variant="outline">Self-service linked</Badge>
          ) : (
            <Badge variant="secondary">Not claimed</Badge>
          )}
          {sponsor.stripe_subscription_id ? (
            <Badge variant="outline">
              Stripe: {sponsor.stripe_subscription_status ?? "unknown"}
            </Badge>
          ) : (
            <Badge variant="secondary">Manual invoicing</Badge>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-brand-gold/15">
        <Stat label="Event impressions" value={impressions} />
        <Stat label="Profile views" value={profileViews} />
        <Stat label="Profile clicks" value={clicks} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Dedup&apos;d per visitor/day. Useful for invoice context, not for billing.
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="font-serif text-2xl font-bold text-brand-deep-green">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
