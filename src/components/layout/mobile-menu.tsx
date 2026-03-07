"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, LayoutDashboard, Shield, X } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import type { Profile } from "@/types";

export function MobileMenu({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-brand-off-white hover:bg-brand-off-white/10 hover:text-brand-gold md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full border-none bg-brand-deep-green sm:max-w-full">
        <div className="flex justify-end p-4">
          <SheetClose asChild>
            <button className="text-brand-gold hover:text-brand-gold/80 transition-colors">
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </button>
          </SheetClose>
        </div>
        <SheetTitle className="text-center font-serif text-2xl font-normal text-brand-gold">
          {SITE_NAME}
        </SheetTitle>
        <nav className="mt-10 flex flex-col items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-serif text-xl text-brand-off-white/90 transition-colors hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
          {profile && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 font-serif text-xl text-brand-gold transition-colors hover:text-brand-off-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              My Dashboard
            </Link>
          )}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 font-serif text-xl text-brand-gold transition-colors hover:text-brand-off-white"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="mt-12 border-t border-brand-gold/15 pt-8">
          {profile ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || ""} />
                  <AvatarFallback className="bg-brand-gold text-sm text-brand-deep-green">
                    {(profile.display_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-brand-off-white">{profile.display_name}</p>
                  <p className="text-xs text-brand-off-white/50">{profile.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 font-serif text-lg text-brand-off-white/90 transition-colors hover:text-brand-gold"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
              >
                <Button className="bg-brand-gold text-brand-deep-green hover:bg-brand-gold/90">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
