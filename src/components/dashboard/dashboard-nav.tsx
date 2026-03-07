"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_LINKS } from "@/lib/constants";

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-brand-gold/10">
      <div className="flex gap-1 overflow-x-auto px-1">
        {DASHBOARD_NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-brand-deep-green text-brand-deep-green"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
