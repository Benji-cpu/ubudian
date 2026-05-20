import { GrainTexture } from "@/components/ui/grain-texture";

export default function ExperiencesLoading() {
  return (
    <div>
      <section className="relative overflow-hidden bg-brand-cream px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-cream/80 via-brand-cream/65 to-brand-cream"
          aria-hidden
        />
        <GrainTexture opacity={0.05} />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="block text-xs uppercase tracking-[0.3em] text-brand-gold">
            Ubud Retreats
          </span>
          <div className="mx-auto my-6 h-px w-12 bg-brand-gold/50" />
          <h1 className="font-serif text-4xl font-medium leading-[1.15] tracking-tight text-brand-deep-green sm:text-5xl md:text-[3.5rem]">
            A soft landing into the scene we&apos;ve been writing about.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
            Ubud&apos;s conscious community lives behind soft doors — practitioners
            who don&apos;t advertise, circles that don&apos;t take strangers,
            tables you have to be brought to. Come for a few days. Villa sorted,
            meals handled, three or four introductions to the people we trust
            most. You leave with phone numbers, not just photographs.
          </p>
        </div>
      </section>
    </div>
  );
}
