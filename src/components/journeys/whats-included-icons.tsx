import {
  DoorOpen,
  Utensils,
  HandHeart,
  Moon,
  UsersRound,
  Sparkle,
  type LucideIcon,
} from "lucide-react";

interface WhatsIncludedIconsProps {
  variant?: "card" | "inline";
}

/**
 * Six tiles describing what an Ubud Retreat actually delivers — phrased as
 * relational access, not amenities. The villa, the meals, the schedule are
 * implied; the value being sold is the introductions.
 */
export function WhatsIncludedIcons({ variant = "card" }: WhatsIncludedIconsProps) {
  const items: { icon: LucideIcon; label: string; sub: string }[] = [
    {
      icon: DoorOpen,
      label: "One door, each day",
      sub: "Each anchor is a person, a place, or a circle you wouldn't find on your own.",
    },
    {
      icon: HandHeart,
      label: "Practitioners we trust",
      sub: "Healers, teachers, ceremony-holders we've worked with for years — not a directory.",
    },
    {
      icon: Utensils,
      label: "Tables you'd never find",
      sub: "A welcome dinner, a long-stayer's home, a kitchen the scene actually eats at.",
    },
    {
      icon: Moon,
      label: "Real rest, not filler",
      sub: "Days with nothing planned. The integration is the practice.",
    },
    {
      icon: UsersRound,
      label: "Four to eight, hand-picked",
      sub: "A small cohort matched for fit. You arrive among strangers. You don't leave that way.",
    },
    {
      icon: Sparkle,
      label: "A field, after",
      sub: "Phone numbers in your pocket, faces you'll see again. The week ends; the access doesn't.",
    },
  ];

  const wrapper =
    variant === "card"
      ? "rounded-md border border-brand-gold/20 bg-brand-cream/30 p-6 sm:p-8"
      : "";

  return (
    <div className={wrapper}>
      <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, label, sub }) => (
          <li key={label} className="group flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-cream text-brand-deep-green transition-colors duration-300 group-hover:border-brand-gold group-hover:bg-brand-gold/10">
              <Icon className="h-5 w-5" strokeWidth={1.25} />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-base font-medium text-brand-deep-green">{label}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">{sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
