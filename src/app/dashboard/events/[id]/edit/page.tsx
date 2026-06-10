import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripEmbeddings } from "@/lib/events/strip-embedding";
import { EventSubmissionForm } from "@/components/events/event-submission-form";
import type { Event } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Event",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/dashboard/events");

  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  const event = data as Event | null;

  // Ownership gate — the PATCH route re-checks, this just keeps the page honest.
  if (
    !event ||
    !event.submitted_by_email ||
    event.submitted_by_email.toLowerCase() !== profile.email.toLowerCase()
  ) {
    notFound();
  }

  const [stripped] = stripEmbeddings([event]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard/events"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to your events
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-medium text-brand-deep-green dark:text-brand-gold">
        Edit event
      </h1>
      <p className="mt-2 text-muted-foreground">
        Changes go live as soon as they pass our automated checks
        {event.status === "approved" ? " — your event stays published while you edit" : ""}.
      </p>
      <div className="mt-8">
        <EventSubmissionForm initialEvent={stripped} />
      </div>
    </div>
  );
}
