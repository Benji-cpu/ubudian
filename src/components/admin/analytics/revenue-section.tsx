import { DollarSign, BadgeCheck, Ticket, Repeat, Percent } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { formatUsd } from "@/lib/analytics/mrr";

export interface RevenueSectionProps {
  activeMembers: number;
  mrrCents: number;
  bookingsRealized: number;
  revenueCollectedCents: number;
  paymentsSucceeded: number;
  totalAccounts: number;
}

export function RevenueSection({
  activeMembers,
  mrrCents,
  bookingsRealized,
  revenueCollectedCents,
  paymentsSucceeded,
  totalAccounts,
}: RevenueSectionProps) {
  const conversionPct =
    totalAccounts > 0
      ? ((activeMembers / totalAccounts) * 100).toFixed(1)
      : "0.0";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-brand-deep-green" />
        <h2 className="text-lg font-semibold">Revenue</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="MRR (est.)"
          value={formatUsd(mrrCents)}
          sublabel={`${activeMembers} active member${activeMembers === 1 ? "" : "s"}`}
          icon={<Repeat className="h-4 w-4" />}
          valueClassName={mrrCents > 0 ? "text-brand-deep-green" : undefined}
        />
        <KpiCard
          label="Member conversion"
          value={`${conversionPct}%`}
          sublabel="Active members ÷ accounts"
          icon={<Percent className="h-4 w-4" />}
        />
        <KpiCard
          label="Tour bookings"
          value={bookingsRealized}
          sublabel="Confirmed + completed"
          icon={<Ticket className="h-4 w-4" />}
          href="/admin/commerce"
        />
        <KpiCard
          label="Revenue collected"
          value={formatUsd(revenueCollectedCents)}
          sublabel={`${paymentsSucceeded} successful payment${paymentsSucceeded === 1 ? "" : "s"}`}
          icon={<BadgeCheck className="h-4 w-4" />}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        MRR is estimated from active-subscription counts (Insider $9.99/mo, $99/yr) —
        the subscriptions table stores no amount, so treat it as indicative, not
        Stripe-authoritative. Revenue collected is the net of all succeeded payments.
      </p>
    </section>
  );
}
