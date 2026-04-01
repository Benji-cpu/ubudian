import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { Calendar, Users, MapPin, FileText, ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "About | The Ubudian",
  description:
    "Community infrastructure for Ubud's conscious scene — tantra, ceremonies, ecstatic dance, shadow work, and everything that actually happens here.",
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
            Community infrastructure for Ubud&apos;s conscious scene — tantra,
            ceremonies, ecstatic dance, shadow work, and everything in between.
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
                Every week in Ubud, people are exploring tantra at Liquid Love
                Temple, doing shadow work at multi-day retreats, crying in
                breathwork sessions, dancing barefoot at ecstatic dance nights,
                sitting in medicine song circles at Dragonfly Village, and falling
                in love with someone they met at a cacao ceremony three hours ago.
                It&apos;s messy and beautiful and transformative — and finding out
                about any of it means scrolling through dozens of WhatsApp groups
                and hoping someone mentions it at the café.
              </p>
              <p>
                The Ubudian puts it all in one place. Every event we can find —
                from intimate tantric temple nights to full moon ceremonies to
                community devotional gatherings — gets ingested, verified, and
                listed. Add stories from the humans who hold space here, tours
                that take you into the landscape, and a weekly newsletter, and
                you have the community hub this scene has been missing.
              </p>
              <p>
                Think of it as that friend who&apos;s been in Ubud for three
                years and knows which breathwork facilitator will actually change
                your life, which tantric temple is safe for beginners, and which
                sound journey is worth rearranging your week for — except now
                anyone can tap into it.
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
                    The eat-pray-love reality checks, the spiritual bypassing
                    call-outs, and the love letters to this messy, transformative community.
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
                    Tantra facilitators, breathwork guides, ceremony holders, sound
                    healers, and the souls who followed something to Bali and never left.
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
                    Sound journeys, tantra workshops, embodiment retreats, sacred
                    circles, and community gatherings — pulled from WhatsApp groups,
                    Telegram channels, and venues across Ubud.
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
                    Rice terraces, water temples, jungle treks, and food trails
                    with guides who live here — for when you want to explore the
                    land itself.
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
            One email a week — so you never hear about the good ceremony
            after it already happened.
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
