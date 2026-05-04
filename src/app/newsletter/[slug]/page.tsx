import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import { EditionRenderer } from "@/components/newsletter/edition-renderer";
import { EditionJsonLd } from "@/components/newsletter/edition-json-ld";
import { ShareButtons } from "@/components/blog/share-buttons";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import type { NewsletterEdition } from "@/types";

interface EditionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditionPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: edition } = await supabase
      .from("newsletter_editions")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!edition) {
      return { title: "Edition Not Found | The Ubudian" };
    }

    const e = edition as NewsletterEdition;

    return {
      title: `${e.subject} | The Ubudian Newsletter`,
      description: e.preview_text || undefined,
    };
  } catch {
    return { title: "Edition Not Found | The Ubudian" };
  }
}

export default async function EditionPage({ params }: EditionPageProps) {
  const settings = await getSiteSettings();
  if (!settings.newsletter_archive_enabled) notFound();

  let e: NewsletterEdition;
  let prevEdition: { slug: string; subject: string } | null = null;
  let nextEdition: { slug: string; subject: string } | null = null;

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: edition } = await supabase
      .from("newsletter_editions")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!edition) {
      notFound();
    }

    e = edition as NewsletterEdition;

    // Get prev/next editions
    const [{ data: prev }, { data: next }] = await Promise.all([
      supabase
        .from("newsletter_editions")
        .select("slug, subject")
        .eq("status", "published")
        .lt("sent_at", e.sent_at || e.created_at)
        .order("sent_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("newsletter_editions")
        .select("slug, subject")
        .eq("status", "published")
        .gt("sent_at", e.sent_at || e.created_at)
        .order("sent_at", { ascending: true })
        .limit(1)
        .single(),
    ]);

    prevEdition = prev;
    nextEdition = next;
  } catch {
    notFound();
  }

  const editionUrl = `${SITE_URL}/newsletter/${e.slug}`;

  return (
    <article>
      <EditionJsonLd edition={e} />
      {/* Header */}
      <header className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <time className="text-sm text-muted-foreground">
            {format(new Date(e.sent_at || e.created_at), "MMMM d, yyyy")}
          </time>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-brand-deep-green sm:text-4xl">
            {e.subject}
          </h1>
          {e.preview_text && (
            <p className="mt-4 text-lg text-muted-foreground">
              {e.preview_text}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EditionRenderer edition={e} />
      </div>

      {/* Share */}
      <div className="mx-auto max-w-3xl border-t px-4 py-8 sm:px-6">
        <ShareButtons title={e.subject} url={editionUrl} />
      </div>

      {/* Prev/Next navigation */}
      <div className="mx-auto max-w-3xl border-t px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          {prevEdition ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/newsletter/${prevEdition.slug}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : <div />}
          {nextEdition ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/newsletter/${nextEdition.slug}`}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : <div />}
        </div>
      </div>

      {/* Subscribe CTA */}
      <section className="bg-brand-pale-green px-4 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            Never miss an edition
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get The Ubudian delivered to your inbox every week.
          </p>
          <NewsletterSignup className="mx-auto mt-6 max-w-md" />
        </div>
      </section>
    </article>
  );
}
