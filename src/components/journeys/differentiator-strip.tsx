import { GrainTexture } from "@/components/ui/grain-texture";
import { WordReveal } from "@/components/ui/word-reveal";

interface DifferentiatorStripProps {
  /** Override the default sentence. Keep it short — this is a typographic event, not a banner. */
  text?: string;
  className?: string;
}

const DEFAULT_TEXT = "Most Ubud retreats hand you a program. We open a door.";

export function DifferentiatorStrip({
  text = DEFAULT_TEXT,
  className = "",
}: DifferentiatorStripProps) {
  return (
    <section
      className={`relative overflow-hidden bg-brand-cream py-16 sm:py-24 ${className}`}
    >
      <GrainTexture opacity={0.06} />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="mx-auto mb-8 h-px w-16 bg-brand-gold/50" />
        <WordReveal
          as="blockquote"
          text={text}
          staggerMs={70}
          className="font-serif text-2xl italic leading-snug text-brand-deep-green sm:text-3xl md:text-[2.25rem] md:leading-[1.2]"
        />
        <div className="mx-auto mt-8 h-px w-16 bg-brand-gold/50" />
      </div>
    </section>
  );
}
