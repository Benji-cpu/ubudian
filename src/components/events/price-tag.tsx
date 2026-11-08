import { cn } from "@/lib/utils";
import type { PriceDisplay } from "@/lib/price-display";

/**
 * The price slot on event cards and timetable rows, from `displayPrice()`:
 * the amount in terracotta, any small print after it, and "Check with the
 * organiser" in quiet grey when the listing gives no usable price.
 */
export function PriceTag({ price, size = "sm", className }: { price: PriceDisplay; size?: "sm" | "base"; className?: string }) {
  const unknown = price.kind === "unknown";
  return (
    <span className={cn("flex min-w-0 items-baseline gap-1.5", className)}>
      <span
        className={cn(
          "shrink-0",
          unknown
            ? "text-xs text-muted-foreground"
            : cn("font-semibold tracking-tight text-brand-terracotta", size === "base" ? "text-base" : "text-sm")
        )}
      >
        {price.label}
      </span>
      {price.note ? <span className="truncate text-xs text-muted-foreground">{price.note}</span> : null}
    </span>
  );
}
