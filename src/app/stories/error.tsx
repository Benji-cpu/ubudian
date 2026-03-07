"use client";

export default function StoriesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto mb-6 h-px w-12 bg-brand-gold/40" />
      <h1 className="font-serif text-3xl font-medium text-brand-deep-green sm:text-4xl">
        Couldn&apos;t load stories
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        We&apos;re having trouble loading Humans of Ubud. Please try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-md bg-brand-deep-green px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-deep-green/90"
      >
        Try again
      </button>
    </div>
  );
}
