import Link from "next/link";
import { SpecialCard } from "@/components/specials/special-card";
import { nowInBali } from "@/lib/events/bali-time";
import { isOnNow, specialsForToday } from "@/lib/specials";
import { getLiveSpecials } from "@/lib/specials/queries";

/**
 * Today's deals, for any page that wants the hook (the homepage first).
 * Deals on right now lead; renders nothing when no deal runs today.
 */
export async function TodaysDeals({ limit = 3 }: { limit?: number }) {
  const now = nowInBali();
  const today = specialsForToday(await getLiveSpecials(), now);
  if (today.length === 0) return null;
  const shown = [...today].sort((a, b) => Number(isOnNow(b, now)) - Number(isOnNow(a, now))).slice(0, limit);

  return (
    <div>
      <div className="space-y-4">
        {shown.map((d) => (
          <SpecialCard key={d.id} special={d} showDays={false} onNow={isOnNow(d, now)} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link href="/deals" className="text-sm font-medium text-brand-deep-green underline underline-offset-4 dark:text-brand-gold">
          All {today.length} deals today, and the rest of the week &rarr;
        </Link>
      </div>
    </div>
  );
}
