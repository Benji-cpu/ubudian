"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, LayoutDashboard, Shield, X } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import type { Profile } from "@/types";
import type { SiteSettings } from "@/lib/site-settings";

const HREF_TO_FLAG: Record<string, keyof SiteSettings> = {
  "/stories": "stories_enabled",
  "/tours": "tours_enabled",
  "/newsletter": "newsletter_archive_enabled",
  "/guides": "guides_enabled",
};

export function MobileMenu({
  profile,
  settings,
}: {
  profile: Profile | null;
  settings: SiteSettings;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  // Whether we own a synthetic history entry for the open sheet, so we
  // can pop it back off when the user closes via the X / a link.
  const pushedEntry = useRef(false);

  // When the sheet opens, push a synthetic history state so the OS Back
  // gesture pops *that* entry (closing the sheet) instead of navigating
  // away from the page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (open && !pushedEntry.current) {
      window.history.pushState({ ubudianMenu: true }, "");
      pushedEntry.current = true;
    }

    function onPop() {
      if (open) setOpen(false);
      pushedEntry.current = false;
    }

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  function closeFromUI() {
    setOpen(false);
    if (pushedEntry.current && typeof window !== "undefined") {
      pushedEntry.current = false;
      window.history.back();
    }
  }

  const visibleLinks = NAV_LINKS.filter((link) => {
    const flag = HREF_TO_FLAG[link.href];
    return !flag || settings[flag];
  });

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    closeFromUI();
    router.refresh();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
        } else {
          closeFromUI();
        }
      }}
    >
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
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full border-none bg-brand-deep-green dark:bg-background sm:max-w-full"
      >
        <div className="flex justify-end p-4">
          <SheetClose asChild>
            <button className="text-brand-gold hover:text-brand-gold/80 transition-colors">
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </button>
          </SheetClose>
        </div>
        <SheetTitle className="flex items-center justify-center gap-2 text-center font-serif text-2xl font-normal text-brand-gold">
          <Image
            src="/brand/logo.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span>{SITE_NAME}</span>
        </SheetTitle>
        <nav className="mt-10 flex flex-col items-center gap-4">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeFromUI}
              className="font-serif text-xl text-brand-off-white/90 transition-colors hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
          {profile && (
            <Link
              href="/dashboard"
              onClick={closeFromUI}
              className="flex items-center gap-2 font-serif text-xl text-brand-gold transition-colors hover:text-brand-off-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              My Dashboard
            </Link>
          )}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              onClick={closeFromUI}
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
                onClick={closeFromUI}
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
