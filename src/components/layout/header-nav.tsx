"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FLAGGED: Record<string, "guides"> = { "/guides": "guides" };

export function HeaderNav({ guidesEnabled, isAdmin }: { guidesEnabled: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  const links = NAV_LINKS.filter((l) => FLAGGED[l.href] !== "guides" || guidesEnabled);

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground/[0.06] text-foreground"
                : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground"
            )}
          >
            {l.label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin"
          className="ml-1 flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-brand-terracotta hover:bg-brand-terracotta/10"
        >
          <Shield className="h-3.5 w-3.5" />
          Admin
        </Link>
      )}
    </nav>
  );
}
