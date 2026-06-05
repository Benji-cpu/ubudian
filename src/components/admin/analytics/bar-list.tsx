import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BarListItem {
  label: string;
  value: number;
  href?: string;
}

export interface BarListProps {
  items: BarListItem[];
  emptyLabel?: string;
  tone?: "green" | "gold";
  formatValue?: (value: number) => string;
}

const TONE = {
  green: "bg-brand-deep-green/10",
  gold: "bg-brand-gold/15",
} as const;

/**
 * Horizontal bar list — a label, a proportional bar, and a right-aligned
 * count. Used for archetype distribution, signups-by-source, and save
 * leaderboards. Pure Tailwind, no chart dependency.
 */
export function BarList({
  items,
  emptyLabel = "No data yet",
  tone = "green",
  formatValue,
}: BarListProps) {
  if (!items.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => {
        const pct = Math.max((item.value / max) * 100, 2);
        const row = (
          <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-1.5">
            <div
              className={cn("absolute inset-y-0 left-0 rounded-md", TONE[tone])}
              style={{ width: `${pct}%` }}
            />
            <span className="relative min-w-0 truncate text-sm">
              {item.label}
            </span>
            <span className="relative shrink-0 text-sm font-semibold tabular-nums">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
        );

        return item.href ? (
          <Link
            key={`${item.label}-${index}`}
            href={item.href}
            className="block rounded-md transition-colors hover:bg-muted/40"
          >
            {row}
          </Link>
        ) : (
          <div key={`${item.label}-${index}`}>{row}</div>
        );
      })}
    </div>
  );
}
