import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Lock } from "lucide-react";
import type { Story } from "@/types";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const leadPhoto = story.photo_urls?.[0];

  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <article className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card transition-shadow hover:shadow-md">
        {leadPhoto ? (
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={leadPhoto}
              alt={story.subject_name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
              {story.subject_name}
            </h3>
            {story.is_members_only && (
              <Badge variant="outline" className="shrink-0 gap-1 border-brand-gold/40 text-brand-gold text-xs">
                <Lock className="h-3 w-3" />
                Members
              </Badge>
            )}
          </div>
          {story.subject_tagline && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {story.subject_tagline}
            </p>
          )}
          {story.theme_tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {story.theme_tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
