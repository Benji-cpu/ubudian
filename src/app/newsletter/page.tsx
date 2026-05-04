import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditionCard } from "@/components/newsletter/edition-card";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { getSiteSettings } from "@/lib/site-settings";
import type { NewsletterEdition } from "@/types";

export const metadata: Metadata = {
  title: "Newsletter Archive | The Ubudian",
  description:
    "Browse past editions of The Ubudian Weekly — events, stories, and community happenings from Ubud's conscious scene.",
};

export default async function NewsletterPage() {
  const settings = await getSiteSettings();
  if (!settings.newsletter_archive_enabled) notFound();

  let allEditions: NewsletterEdition[] = [];

  try {
    const supabase = await createClient();

    const { data: editions, error } = await supabase
      .from("newsletter_editions")
      .select("*")
      .eq("status", "published")
      .order("sent_at", { ascending: false });

    if (error) console.error("Newsletter editions query error:", error);
    allEditions = (editions ?? []) as NewsletterEdition[];
  } catch {
    // Supabase unreachable — render with empty state
  }

  return (
    <div>
      {/* Hero + Signup */}
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            The Ubudian Newsletter
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            One email a week with the ceremonies, workshops, sound journeys,
            community stories, and conversations that matter in Ubud right now.
          </p>
          <NewsletterSignup className="mx-auto mt-8 max-w-md" />
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Already subscribed?{" "}
            <Link href="/quiz" className="font-medium text-brand-terracotta hover:underline">
              Take the Ubud Spirit Quiz
            </Link>{" "}
            to get personalized picks in your weekly email.
          </p>
        </div>
      </section>

      {/* Archive */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
          Past Editions
        </h2>
        {allEditions.length === 0 ? (
          <div className="mt-8 py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No editions published yet — subscribe and you&apos;ll be the first to read one.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {allEditions.map((edition) => (
              <EditionCard key={edition.id} edition={edition} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
