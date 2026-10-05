"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Mail, Sun, Tag } from "lucide-react";
import { TAB_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = { Sun, Tag, CalendarDays, Mail } as const;

/** Phone-only bottom bar, like an app: Today, Deals, Events, the weekly email. Hidden on admin pages. */
export function TabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Spacer so the last bit of every page clears the bar. */}
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          {TAB_LINKS.map((t) => {
            const Icon = ICONS[t.icon];
            const active = t.href === "/" ? pathname === "/" : !t.href.includes("#") && pathname.startsWith(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-brand-deep-green dark:text-brand-gold" : "text-foreground/55"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} aria-hidden />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
