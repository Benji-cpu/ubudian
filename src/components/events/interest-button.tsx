"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnonId } from "@/lib/events/anon-id";

/** Below this, a count reads as "nobody's going", so it isn't shown. */
const SHOW_COUNT_FROM = 3;

/**
 * "I'm interested": no sign-in, one tap. Counts help the events desk pick the
 * week's best; the reader's choice is remembered in this browser only.
 */
export function InterestButton({ eventId, initialCount }: { eventId: string; initialCount: number }) {
  const key = `ubudian-interest:${eventId}`;
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setOn(localStorage.getItem(key) === "1");
    } catch {}
  }, [key]);

  async function toggle() {
    const anonId = getAnonId();
    if (!anonId || busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      localStorage.setItem(key, next ? "1" : "0");
    } catch {}
    try {
      const res = await fetch("/api/events/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, kind: "interest", anon_id: anonId, remove: !next }),
      });
      const json = await res.json().catch(() => null);
      if (typeof json?.data?.interest === "number") setCount(json.data.interest);
    } catch {
      // Offline: keep the local state; the count catches up next visit.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 px-4 sm:px-6">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          on
            ? "border-brand-gold bg-brand-gold/15 text-brand-deep-green"
            : "border-brand-deep-green/20 text-foreground hover:border-brand-gold/60",
        )}
      >
        <Star className={cn("h-4 w-4", on && "fill-brand-gold text-brand-gold")} />
        {on ? "You're interested" : "I'm interested"}
      </button>
      <span className="text-sm text-muted-foreground">
        {count >= SHOW_COUNT_FROM ? `${count} people interested. ` : ""}
        It helps us pick the week&apos;s best.
      </span>
    </div>
  );
}
