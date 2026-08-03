import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { PageHero } from "@/components/layout/page-hero";
import { getSiteSettings, type SiteSettings } from "@/lib/site-settings";
import {
  Sparkles,
  Calendar,
  Users,
  Map,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "One place for everything happening in Ubud's conscious community — ceremonies, dance, breathwork and sound, gathered daily and sent out once a week.",
};

// Cards advertising a flag-gated section have to be gated too, or the page
// promises "Meet the community" and hands the reader a 404.
const WHAT_WE_DO: {
  title: string;
  description: string;
  href: string;
  icon: typeof Sparkles;
  iconColor: string;
  flag?: keyof SiteSettings;
}[] = [
  {
    title: "Discover your Ubud Spirit",
    description:
      "Take the quiz to find your archetype and get personalized recommendations for events and experiences.",
    href: "/quiz",
    icon: Sparkles,
    iconColor: "text-brand-gold",
  },
  {
    title: "Find what's happening",
    description:
      "Browse events aggregated from community sources and organizer submissions, updated daily.",
    href: "/events",
    icon: Calendar,
    iconColor: "text-brand-terracotta",
  },
  {
    title: "Go deeper",
    description:
      "Practical guides to living in Ubud, and multi-day retreats hosted by people who live here.",
    href: "/guides",
    icon: Map,
    iconColor: "text-brand-deep-green",
    flag: "guides_enabled",
  },
  {
    title: "Meet the community",
    description:
      "Read the stories of facilitators, healers, and creators who make Ubud what it is.",
    href: "/stories",
    icon: Users,
    iconColor: "text-brand-deep-green",
    flag: "stories_enabled",
  },
  {
    title: "Explore the land",
    description:
      "Rice terraces, water temples, jungle treks, and food trails with guides who live here.",
    href: "/tours",
    icon: Map,
    iconColor: "text-brand-deep-green",
    flag: "tours_enabled",
  },
];

const SOLUTION_POINTS = [
  "Events aggregated from community sources and submitted by organizers — screened and published daily",
  "The Ubud Spirit Quiz matches you to one of five archetypes for personalized recommendations",
  "Practical guides to arriving, staying, and finding your people",
  "A weekly email that picks out what's worth your evening",
] as const;

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const whatWeDo = WHAT_WE_DO.filter((item) => !item.flag || settings[item.flag]);

  return (
    <div>
      {/* Hero */}
      <PageHero
        variant="cream"
        title="About The Ubudian"
        subtitle="One place for everything happening in Ubud's conscious community."
      />

      {/* The Problem */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-brand-deep-green sm:text-3xl">
          The Problem
        </h2>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>
            Ubud has more ecstatic dance, breathwork, and cacao ceremonies per
            square kilometer than anywhere on Earth. Finding them means
            monitoring 10+ WhatsApp groups, following 50 Instagram accounts, and
            asking that friend who&apos;s been here for three years.
          </p>
          <p>
            We built The Ubudian because the community deserved better than
            scattered posts and secondhand tips.
          </p>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-y border-brand-deep-green/10 bg-brand-cream/50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green sm:text-3xl">
            The Solution
          </h2>
          <ul className="mt-8 space-y-4">
            {SOLUTION_POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep-green" />
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What We Do */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-serif text-2xl font-bold text-brand-deep-green sm:text-3xl">
            What We Do
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whatWeDo.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                    <CardTitle className="mt-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Event Organizers */}
      <section className="bg-brand-cream px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green sm:text-3xl">
            For Event Organizers
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Run a workshop, ceremony, or class in Ubud? Submit your event for
            free. Submissions are screened nightly — give it a real description
            and a venue we can find, and it goes live. After 5 approved events
            you become a trusted submitter and skip the queue entirely.
          </p>
          <Link
            href="/events/submit"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-3 font-semibold text-brand-deep-green transition-colors hover:bg-brand-gold/90"
          >
            Submit an Event
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-[#2C4A3E] px-4 py-16 dark:bg-[#1A1A1A]">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-off-white">
            Join the Community
          </h2>
          <p className="mt-3 text-lg text-brand-off-white/80">
            One email a week — so you never hear about the good ceremony after
            it already happened.
          </p>
          <NewsletterSignup variant="dark" className="mx-auto mt-6 max-w-md" />
          <p className="mt-2 text-sm text-brand-off-white/60">
            No spam, unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Connect */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Connect With Us
          </h2>
          <div className="mt-6 space-y-3">
            <p>
              <a
                href="https://instagram.com/theubudian"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
              >
                Follow us on Instagram
              </a>
            </p>
            <p className="text-muted-foreground">
              Have a tip, story idea, or just want to say hi? We&apos;d love to
              hear from you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
