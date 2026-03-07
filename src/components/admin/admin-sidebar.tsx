"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_LINKS } from "@/lib/constants";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Mail,
  MapPin,
  UserPlus,
  ShieldCheck,
  Zap,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Mail,
  MapPin,
  UserPlus,
  ShieldCheck,
  Zap,
};

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="flex h-full flex-col">
        <div className="border-b px-6 py-4">
          <h2 className="font-serif text-lg font-semibold">Admin</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {ADMIN_NAV_LINKS.map((link) => {
            const Icon = iconMap[link.icon];
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
