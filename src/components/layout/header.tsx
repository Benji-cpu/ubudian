import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";
import { ExploreMenu } from "./explore-menu";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export async function Header() {
  const [profile, settings] = await Promise.all([
    getCurrentProfile(),
    getSiteSettings(),
  ]);

  return (
    <header
      className="fixed top-0 z-50 w-full border-b border-brand-gold/15 bg-brand-deep-green/85 backdrop-blur-[12px] dark:bg-background/90"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="py-2 font-serif text-xl font-normal tracking-wide text-brand-gold sm:text-2xl"
        >
          {SITE_NAME}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/quiz"
            className="text-xs font-semibold uppercase tracking-widest text-brand-off-white transition-colors duration-300 hover:text-brand-gold"
          >
            Quiz
          </Link>
          <Link
            href="/events"
            className="text-xs font-semibold uppercase tracking-widest text-brand-off-white transition-colors duration-300 hover:text-brand-gold"
          >
            Events
          </Link>
          {settings.stories_enabled && (
            <Link
              href="/stories"
              className="text-xs font-semibold uppercase tracking-widest text-brand-off-white transition-colors duration-300 hover:text-brand-gold"
            >
              Stories
            </Link>
          )}
          {settings.tours_enabled && (
            <Link
              href="/tours"
              className="text-xs font-semibold uppercase tracking-widest text-brand-off-white transition-colors duration-300 hover:text-brand-gold"
            >
              Tours
            </Link>
          )}
          <ExploreMenu newsletterEnabled={settings.newsletter_archive_enabled} />
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-brand-gold transition-colors duration-300 hover:text-brand-off-white"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side: Auth + Mobile */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden border border-brand-gold/30 bg-transparent text-brand-gold hover:bg-brand-gold/10 hover:text-brand-gold md:inline-flex"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          )}
          <MobileMenu profile={profile} settings={settings} />
        </div>
      </div>
    </header>
  );
}
