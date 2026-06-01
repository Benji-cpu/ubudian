"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  count?: number;
  /** localStorage key so a reader's open/closed choice persists across visits. */
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Lightweight collapsible used for the "More happenings in Ubud" discovery
 * section. The heavy content (bucketed event cards) is server-rendered and
 * passed in as children; this client island only owns the toggle + persistence,
 * keeping the conscious-community feed primary and the discovery tier opt-in.
 */
export function CollapsibleSection({
  title,
  subtitle,
  count,
  storageKey,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Restore the reader's last choice after mount (avoids SSR/localStorage seam).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "open") setOpen(true);
      else if (stored === "closed") setOpen(false);
    } catch {
      /* private mode / no storage — fall back to defaultOpen */
    }
  }, [storageKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, next ? "open" : "closed");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 rounded-2xl border border-brand-deep-green/10 bg-brand-cream/50 px-5 py-4 text-left transition-colors hover:border-brand-gold/40 hover:bg-brand-cream/80 dark:border-brand-deep-green/20 dark:bg-card/30 dark:hover:bg-card/50"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-serif text-xl font-medium text-brand-deep-green sm:text-2xl dark:text-brand-gold">
              {title}
            </span>
            {typeof count === "number" && count > 0 && (
              <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-xs font-semibold text-brand-deep-green dark:text-brand-gold">
                {count}
              </span>
            )}
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-sm text-muted-foreground break-words">
              {subtitle}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-deep-green/80 dark:text-brand-gold/80">
          <span className="hidden sm:inline">{open ? "Hide" : "Explore"}</span>
          <ChevronDown
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {/* Grid-rows height animation keeps the children in the DOM (server-rendered)
          while collapsing cleanly to zero height when closed. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
