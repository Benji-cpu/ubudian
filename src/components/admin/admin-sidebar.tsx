"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_LINKS, ADMIN_GROUPED_ROUTES } from "@/lib/constants";
import type { AdminNavItem } from "@/lib/constants";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  MapPin,
  Zap,
  CreditCard,
  Menu,
  Settings,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  MapPin,
  Zap,
  CreditCard,
  Settings,
};

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {ADMIN_NAV_LINKS.map((item: AdminNavItem, index: number) => {
        if (item.type === "divider") {
          return (
            <hr
              key={`divider-${index}`}
              className="my-2 border-t border-border"
            />
          );
        }

        const Icon = iconMap[item.icon];
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href) ||
              (ADMIN_GROUPED_ROUTES[item.href]?.some((sub) =>
                pathname.startsWith(sub)
              ) ??
                false);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="flex h-full flex-col">
        <div className="border-b px-6 py-4">
          <h2 className="font-serif text-lg font-semibold">Admin</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLinks />
        </nav>
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open admin menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle className="font-serif text-lg">Admin</SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 px-3 py-4">
            <NavLinks onClick={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
