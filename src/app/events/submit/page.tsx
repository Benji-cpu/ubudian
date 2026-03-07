import type { Metadata } from "next";
import { EventSubmissionForm } from "@/components/events/event-submission-form";

export const metadata: Metadata = {
  title: "Submit an Event | The Ubudian",
  description: "Submit your event to the Ubud events directory.",
};

export default function SubmitEventPage() {
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
            Share your event with the Ubud community. All submissions are reviewed
            before publishing.
          </p>
        </div>
      </section>

      {/* Guidelines + Form */}
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          <h3 className="mb-2 font-medium text-foreground">Submission Guidelines</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Events must take place in or around Ubud, Bali</li>
            <li>Include accurate dates, times, and venue information</li>
            <li>Provide a way for people to contact you or buy tickets</li>
            <li>Events are typically reviewed within 24 hours</li>
            <li>Trusted submitters get automatic approval</li>
          </ul>
        </div>

        <EventSubmissionForm />
      </section>
    </div>
  );
}
