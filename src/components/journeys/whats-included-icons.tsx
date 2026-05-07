import {
  BedDouble,
  UtensilsCrossed,
  Compass,
  Leaf,
  Users,
  Sparkles,
} from "lucide-react";

interface WhatsIncludedIconsProps {
  variant?: "card" | "inline";
}

/**
 * Six tiles describing what every Ubud Retreat actually holds. Renders below
 * the hero summary on detail pages and above the cards on the listing.
 *
 * `card` variant — boxed, on its own background. Used on listing.
 * `inline` variant — flush, no background. Used on detail page below the
 * narrative summary, before the day-by-day.
 */
export function WhatsIncludedIcons({ variant = "card" }: WhatsIncludedIconsProps) {
  const items: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string }[] = [
    {
      icon: BedDouble,
      label: "A villa, sorted",
      sub: "Quiet, light-filled, walking distance to your morning anchors.",
    },
    {
      icon: UtensilsCrossed,
      label: "Curated meals",
      sub: "Welcome dinner and farewell pinned. The rest, hand-picked.",
    },
    {
      icon: Compass,
      label: "One good anchor a day",
      sub: "A ceremony, a class, a temple. Not three. Mostly.",
    },
    {
      icon: Leaf,
      label: "Real rest days",
      sub: "Built in. The rest is the practice, not a gap.",
    },
    {
      icon: Users,
      label: "A soft cohort",
      sub: "Others walking the same arc — opt in to find them.",
    },
    {
      icon: Sparkles,
      label: "A closing reflection",
      sub: "One voice note or written line, before you fly.",
    },
  ];

  const wrapper =
    variant === "card"
      ? "rounded-md border border-brand-gold/20 bg-brand-cream/30 p-6 sm:p-8"
      : "";

  return (
    <div className={wrapper}>
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, label, sub }) => (
          <li key={label} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-deep-green/10 text-brand-deep-green">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-deep-green">{label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
