import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ImageIcon } from "lucide-react";
import { CATEGORY_EMOJI } from "@/lib/constants";
import type { Experience } from "@/types";

interface ExperienceCardProps {
  experience: Experience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const emoji = CATEGORY_EMOJI[experience.category] || "";

  return (
    <Link href={`/experiences/${experience.slug}`} className="group block">
      <article className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card transition-shadow hover:shadow-md">
        {experience.cover_image_url ? (
          <div className="relative aspect-video w-full">
            <Image
              src={experience.cover_image_url}
              alt={experience.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="p-5">
          <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
            {experience.title}
          </h3>
          {experience.short_description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {experience.short_description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">
              {emoji} {experience.category}
            </Badge>
            {experience.archetype_tags?.map((tag) => (
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
