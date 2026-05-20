export default function GuidesLoading() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-brand-deep-green text-brand-cream">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,168,76,0.18),_transparent_60%)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand-gold">
            The Ubudian Guides
          </p>
          <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            Free, opinionated, lived-in.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-cream/80 sm:text-xl">
            The shortcuts and the soul-work — written by people who actually
            live here, for people arriving with intent.
          </p>
          <div className="mx-auto mt-10 h-px w-12 bg-brand-gold/50" />
        </div>
      </section>
    </div>
  );
}
