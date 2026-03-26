"use client";

import { useState } from "react";
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
  Compass,
  UserPlus,
  ShieldCheck,
  Zap,
  CreditCard,
  Sparkles,
  Menu,
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
  Mail,
  MapPin,
  Compass,
  UserPlus,
  ShieldCheck,
  Zap,
  CreditCard,
  Sparkles,
};

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
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
            onClick={onClick}
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
