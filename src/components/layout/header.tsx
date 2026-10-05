import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";
import { HeaderNav } from "./header-nav";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

/**
 * Light, app-style header (UI refresh 5 Oct 2026, after todo.today): the
 * wordmark, the sections as quiet links with the current one marked, and one
 * call to action — the weekly email.
 */
export async function Header() {
  const [profile, settings] = await Promise.all([getCurrentProfile(), getSiteSettings()]);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/brand/logo.svg" alt="" width={28} height={28} priority className="h-7 w-7" />
          <span className="font-display text-xl text-brand-deep-green dark:text-brand-gold">{SITE_NAME}</span>
        </Link>

        <HeaderNav guidesEnabled={settings.guides_enabled} isAdmin={profile?.role === "admin"} />

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/newsletter">Get the weekly</Link>
          </Button>
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Link
              href="/login"
              className="hidden px-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground md:inline"
            >
              Sign in
            </Link>
          )}
          <MobileMenu profile={profile} settings={settings} />
        </div>
      </div>
    </header>
  );
}
