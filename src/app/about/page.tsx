import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { Calendar, Users, MapPin, FileText, ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "About | The Ubudian",
  description:
    "The Ubudian is your insider guide to Ubud — connecting the community through events, stories, tours, and a weekly newsletter.",
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-brand-deep-green sm:text-5xl">
            About The Ubudian
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your insider guide to Ubud — connecting the community through
            events, stories, tours, and the weekly newsletter.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl font-bold text-brand-deep-green sm:text-3xl">
              Why The Ubudian Exists
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                Ubud is a place like no other — a melting pot of Balinese
                tradition, global creativity, and spiritual seekers. But for a
                community this vibrant, it can feel surprisingly fragmented.
                Events live in scattered WhatsApp groups. Newcomers don&apos;t
                know where to start. Talented locals go unnoticed.
              </p>
              <p>
                The Ubudian was created to bring it all together. One platform
                where you can discover what&apos;s happening, read stories from
                the people who make Ubud special, find curated tours beyond the
                tourist trail, and stay connected through a weekly newsletter.
              </p>
              <p>
                Think of it as your friend who&apos;s lived in Ubud for years
                and always knows the best stuff going on — except now it&apos;s
                a website, and everyone can benefit from it.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex h-64 w-full items-center justify-center rounded-xl bg-muted">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Photo coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="bg-brand-off-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-serif text-2xl font-bold text-brand-deep-green sm:text-3xl">
            What We Do
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/blog">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <FileText className="h-8 w-8 text-brand-deep-green" />
                  <CardTitle className="mt-2">Blog</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Guides, insights, and reflections on life in Ubud — from
                    local food spots to navigating expat life.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/stories">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <Users className="h-8 w-8 text-brand-terracotta" />
                  <CardTitle className="mt-2">Humans of Ubud</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Meet the people who make Ubud special — locals, expats,
                    artists, healers, and entrepreneurs sharing their stories.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/events">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <Calendar className="h-8 w-8 text-brand-gold" />
                  <CardTitle className="mt-2">Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Discover what&apos;s happening in Ubud — from yoga workshops
                    to live music, art exhibitions, and community gatherings.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tours">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <MapPin className="h-8 w-8 text-brand-deep-green" />
                  <CardTitle className="mt-2">Tours</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Curated experiences beyond the tourist trail — rice terraces,
                    temples, food tours, and hidden gems with local guides.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-brand-deep-green px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-off-white">
            Join the Community
          </h2>
          <p className="mt-3 text-lg text-brand-off-white/80">
            Get the weekly Ubudian newsletter — events, stories, and local tips
            delivered to your inbox.
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
