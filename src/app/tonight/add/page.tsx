import type { Metadata } from "next";
import { SpecialSubmissionForm } from "@/components/specials/special-submission-form";

export const metadata: Metadata = {
  title: "Add your deal — Ubud deals",
  description:
    "List your restaurant or bar's weekly deal on The Ubudian for free. It shows on the days it runs.",
};

export default function AddSpecialPage() {
  return (
    <div>
      <section className="bg-brand-cream px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep-green sm:text-5xl">
            Add your deal
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Free for Ubud restaurants, cafés and bars. Your deal shows on The Ubudian on the
            days it runs, and guests tell you The Ubudian sent them.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>One deal per form: a 2-for-1, a set lunch, a happy hour, a weekly night. Add as many as you run.</li>
            <li>It goes live as soon as you send it. Nothing to pay, now or later, unless you choose to.</li>
            <li>Once a month we message you to check it&apos;s still running. If we don&apos;t hear back, it comes off.</li>
          </ul>
        </div>
        <SpecialSubmissionForm />
      </section>
    </div>
  );
}
