import { DollarSign, BadgeCheck, Ticket } from "lucide-react";
import { KpiCard } from "./kpi-card";

export interface RevenueSectionProps {
  bookingsRealized: number;
  revenueCollectedCents: number;
  paymentsSucceeded: number;
}

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function RevenueSection({
  bookingsRealized,
  revenueCollectedCents,
  paymentsSucceeded,
}: RevenueSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-brand-deep-green" />
        <h2 className="text-lg font-semibold">Revenue</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        Revenue collected is the net of all succeeded payments.
      </p>
    </section>
  );
}
