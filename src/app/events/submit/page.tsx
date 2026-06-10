import type { Metadata } from "next";
import Link from "next/link";
import { EventSubmissionForm } from "@/components/events/event-submission-form";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BadgeCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Submit an Event",
  description: "Submit your ceremony, workshop, gathering, or event to The Ubudian community calendar.",
};

export default async function SubmitEventPage() {
  // Signed-in organizers get a standing strip linking to their events.
  const profile = await getCurrentProfile();
  let publishedCount = 0;
  if (profile?.email) {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by_email", profile.email.toLowerCase())
      .eq("status", "approved");
    publishedCount = count ?? 0;
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-cream px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            Submit an Event
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Hosting a ceremony, tantra workshop, sound journey, circle, or
            gathering in Ubud? Share it with the community — it publishes as
            soon as it passes our automated checks.
          </p>
        </div>
      </section>

      {/* Guidelines + Form */}
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {publishedCount > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-gold/20 bg-card p-4">
            <BadgeCheck className="h-5 w-5 shrink-0 text-brand-deep-green dark:text-brand-gold" />
            <p className="text-sm text-muted-foreground">
              You&apos;ve published {publishedCount}{" "}
              {publishedCount === 1 ? "event" : "events"} with us —{" "}
              <Link
                href="/dashboard/events"
                className="font-medium text-brand-deep-green underline underline-offset-4 dark:text-brand-gold"
              >
                manage or edit them here
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mb-8 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          <h3 className="mb-2 font-medium text-foreground">Submission Guidelines</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Events must take place in or around Ubud, Bali</li>
            <li>Include accurate dates, times, and venue information</li>
            <li>Provide a way for people to contact you, register, or buy tickets</li>
            <li>Workshops, ceremonies, retreats, sound journeys, circles, and community gatherings are all welcome</li>
            <li>Submissions publish instantly after automated checks; our editors review the calendar daily</li>
            <li>Sign in before submitting to edit your events later from your dashboard</li>
          </ul>
        </div>

        <EventSubmissionForm />
      </section>
    </div>
  );
}
