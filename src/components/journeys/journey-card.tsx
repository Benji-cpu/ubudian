import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Journey } from "@/types";

interface JourneyCardProps {
  journey: Journey;
}

export function JourneyCard({ journey }: JourneyCardProps) {
  const tierLabel = journey.tier === "signature_cohort" ? "Signature" : null;

  return (
    <Link href={`/experiences/${journey.slug}`} className="group block">
      <article className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card transition-shadow hover:shadow-md">
        {journey.cover_image_url ? (
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={journey.cover_image_url}
              alt={journey.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {journey.length_days} {journey.length_days === 1 ? "day" : "days"}
                </span>
                {tierLabel && (
                  <span className="rounded-full bg-brand-gold/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-brand-deep-green">
                    {tierLabel}
                  </span>
                )}
              </div>
              <h3 className="mt-1 font-serif text-xl font-semibold leading-tight">
                {journey.title}
              </h3>
              {journey.subtitle && (
                <p className="mt-1 text-sm opacity-90 line-clamp-2">
                  {journey.subtitle}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="p-5">
          {!journey.cover_image_url && (
            <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
              {journey.title}
            </h3>
          )}
          {journey.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {journey.summary}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {journey.archetype_tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
