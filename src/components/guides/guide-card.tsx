import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { Guide } from "@/types";
import { GUIDE_INTENTS } from "@/lib/guides/intents";

type Variant = "intent-large" | "intent-medium" | "practical";

interface GuideCardProps {
  guide: Guide;
  variant?: Variant;
  priority?: boolean;
}

function intentLabels(guide: Guide): string[] {
  return guide.intent_tags
    .map((id) => GUIDE_INTENTS.find((i) => i.id === id)?.label ?? null)
    .filter((l): l is string => Boolean(l));
}

function formatLastUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function GuideCard({ guide, variant = "intent-medium", priority = false }: GuideCardProps) {
  const labels = intentLabels(guide);
  const updatedAt = formatLastUpdated(guide.last_updated_at);
  const href = `/guides/${guide.slug}`;
  const image = guide.card_image_url ?? guide.hero_image_url;

  if (variant === "practical") {
    return (
      <Link href={href} className="group block">
        <article className="flex h-full flex-col overflow-hidden rounded-sm border border-brand-gold/10 bg-card transition-all duration-300 hover:border-brand-gold/30 hover:shadow-sm">
          {image ? (
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          ) : (
            <div className="aspect-[16/10] w-full bg-brand-cream" />
          )}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-serif text-lg font-medium leading-snug text-brand-deep-green group-hover:text-primary">
              {guide.title}
            </h3>
            {guide.subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-brand-charcoal-light line-clamp-2">
                {guide.subtitle}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between pt-4 text-xs uppercase tracking-[0.14em] text-brand-charcoal/55">
              <span>Survival Guide</span>
              {updatedAt && <span>Updated {updatedAt}</span>}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Intent variants share structure; large grows the hero, raises the title size, gives a serifed kicker.
  const isLarge = variant === "intent-large";

  return (
    <Link href={href} className="group block">
      <article className="overflow-hidden rounded-sm bg-card transition-shadow duration-300 hover:shadow-md">
        {image ? (
          <div className={`relative w-full overflow-hidden ${isLarge ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
            <Image
              src={image}
              alt=""
              fill
              priority={priority}
              sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {guide.is_members_only && (
              <Badge variant="outline" className="absolute right-3 top-3 gap-1 border-brand-cream/60 bg-brand-deep-green/70 text-brand-cream backdrop-blur-sm">
                <Lock className="h-3 w-3" />
                Members
              </Badge>
            )}
          </div>
        ) : (
          <div className={`w-full bg-brand-cream ${isLarge ? "aspect-[4/5]" : "aspect-[3/4]"}`} />
        )}
        <div className={isLarge ? "px-1 pt-6 pb-2" : "px-1 pt-5 pb-2"}>
          {labels.length > 0 && (
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
              {labels[0]}
            </p>
          )}
          <h3 className={`mt-3 font-serif font-medium leading-tight text-brand-deep-green group-hover:text-primary ${isLarge ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>
            {guide.title}
          </h3>
          {guide.subtitle && (
            <p className={`mt-3 leading-relaxed text-brand-charcoal-light ${isLarge ? "text-base line-clamp-3 sm:text-lg" : "text-sm line-clamp-2"}`}>
              {guide.subtitle}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
