import Image from "next/image";
import Link from "next/link";
import type { ArchetypeResult } from "@/types";

interface QuizArchetypeCardProps {
  archetype: ArchetypeResult;
}

export function QuizArchetypeCard({ archetype }: QuizArchetypeCardProps) {
  return (
    <Link
      href={`/quiz/results/${archetype.id}`}
      className="group relative block overflow-hidden rounded-xl border border-brand-cream transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[3/2]">
        <Image
          src={archetype.hero_image}
          alt={archetype.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-serif text-xl font-medium text-white">{archetype.name}</h3>
          <p className="mt-1 text-sm text-white/80">{archetype.tagline}</p>
        </div>
      </div>
    </Link>
  );
}
