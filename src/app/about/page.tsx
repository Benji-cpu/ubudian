import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import {
  Sparkles,
  Calendar,
  Users,
  Map,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | The Ubudian",
  description:
    "One place for everything happening in Ubud's conscious community — events, stories, tours, and a weekly newsletter.",
};

const WHAT_WE_DO = [
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
    title: "Meet the community",
    description:
      "Read the stories of facilitators, healers, and creators who make Ubud what it is.",
    href: "/stories",
    icon: Users,
    iconColor: "text-brand-deep-green",
  },
  {
    title: "Explore the land",
    description:
      "Rice terraces, water temples, jungle treks, and food trails with guides who live here.",
    href: "/tours",
    icon: Map,
    iconColor: "text-brand-deep-green",
  },
] as const;

const SOLUTION_POINTS = [
  "Events aggregated from community sources and submitted by organizers — reviewed and published daily",
  "The Ubud Spirit Quiz matches you to one of five archetypes for personalized recommendations",
  "Humans of Ubud profiles the facilitators, healers, and creators behind the events",
  "A weekly newsletter keeps you in the loop with what's happening this week",
] as const;

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-brand-deep-green sm:text-5xl">
            About The Ubudian
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            One place for everything happening in Ubud&apos;s conscious
            community.
          </p>
        </div>
      </section>

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
            {WHAT_WE_DO.map((item) => (
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
            free. We review submissions within 24 hours. After 5 approved
            events, you become a trusted submitter — your events go live
            automatically.
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
      <section className="bg-brand-deep-green px-4 py-16">
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
