"use client";

export default function NewsletterError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
      <h1 className="font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
        Couldn&apos;t load the newsletter
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        We&apos;re having trouble loading this page. Please try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
