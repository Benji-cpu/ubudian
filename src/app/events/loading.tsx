import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton";

export default function EventsLoading() {
  return (
    <div className="-mt-14">
      <section
        className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#2C4A3E] via-[#3A5F50] to-[#8BAF8A] dark:from-[#0D1A14] dark:via-[#152820] dark:to-[#1A2A22]"
        aria-label="Events in Ubud"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="events-loading-botanical"
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="60" cy="60" r="40" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
              <circle cx="60" cy="60" r="20" fill="none" stroke="#F0EAD6" strokeWidth="0.5" />
              <line x1="60" y1="20" x2="60" y2="100" stroke="#F0EAD6" strokeWidth="0.3" />
              <line x1="20" y1="60" x2="100" y2="60" stroke="#F0EAD6" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#events-loading-botanical)" />
        </svg>

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-7 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-brand-gold/50" />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-brand-gold/80">
              Ubud · This week and beyond
            </span>
            <span className="h-px w-10 bg-brand-gold/50" />
          </div>

          <h1 className="font-serif text-5xl font-normal tracking-wide text-brand-gold sm:text-6xl lg:text-7xl">
            What&apos;s happening{" "}
            <span className="italic">in Ubud.</span>
          </h1>

          <p className="mt-6 font-serif text-xl italic text-[#FAF5EC] sm:text-2xl">
            The pulse of the valley, gathered daily.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
