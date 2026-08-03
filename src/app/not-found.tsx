import Link from "next/link";
import { NotFoundContent } from "@/components/ui/not-found-content";
import { getSiteSettings, type SiteSettings } from "@/lib/site-settings";

/**
 * "Try one of these instead" only helps if the destinations exist. This page
 * used to hardcode Events / Stories / Tours / Newsletter — and with production
 * flags, three of those four were themselves 404s. Every suggestion is now
 * either unconditional or gated on the same flag that controls the section.
 */
const SUGGESTIONS: { href: string; label: string; flag?: keyof SiteSettings }[] = [
  { href: "/events", label: "Events" },
  { href: "/guides", label: "Guides", flag: "guides_enabled" },
  { href: "/experiences", label: "Ubud Retreats" },
  { href: "/quiz", label: "Take the quiz" },
  { href: "/stories", label: "Stories", flag: "stories_enabled" },
  { href: "/tours", label: "Tours", flag: "tours_enabled" },
  { href: "/newsletter", label: "Newsletter", flag: "newsletter_archive_enabled" },
];

export default async function NotFound() {
  const settings = await getSiteSettings();
  const links = SUGGESTIONS.filter((s) => !s.flag || settings[s.flag]);

  return (
    <div>
      <NotFoundContent
        title="Wrong turn"
        description="This page doesn't exist — but there's plenty that does."
      />
      <div className="bg-brand-cream pb-16 text-center">
        <p className="text-sm text-muted-foreground">Try one of these instead:</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-deep-green dark:text-brand-off-white hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
