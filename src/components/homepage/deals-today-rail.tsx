import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SpecialCard } from "@/components/specials/special-card";
import type { Special } from "@/types";

/** Today's deals as a swipeable row on phones, a grid on desktop. */
export function DealsTodayRail({ deals }: { deals: Special[] }) {
  if (deals.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed p-6 text-muted-foreground">
        No deals listed for the rest of today.{" "}
        <Link href="/deals" className="font-medium text-foreground underline underline-offset-4">
          See this week&apos;s
        </Link>
      </p>
    );
  }
  return (
    <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
      {deals.slice(0, 6).map((d) => (
        <div key={d.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
          <SpecialCard special={d} showDays={false} />
        </div>
      ))}
      {deals.length > 6 && (
        <Link
          href="/deals"
          className="flex w-[40%] shrink-0 snap-start items-center justify-center gap-1 rounded-xl border text-sm font-medium sm:hidden"
        >
          {deals.length - 6} more <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
