import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Clock } from "lucide-react";
import { formatUsdPrice } from "@/lib/stripe/helpers";
import type { Tour } from "@/types";

interface TourCardProps {
  tour: Tour;
}

export function TourCard({ tour }: TourCardProps) {
  const leadPhoto = tour.photo_urls?.[0];

  return (
    <Link href={`/tours/${tour.slug}`} className="group block">
      <article className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card transition-shadow hover:shadow-md">
        {leadPhoto ? (
          <div className="relative aspect-video w-full">
            <Image
              src={leadPhoto}
              alt={tour.title}
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
            {tour.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {tour.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {tour.duration}
              </span>
            )}
            {tour.price_per_person && (
              <span className="font-medium text-brand-terracotta">
                {formatUsdPrice(tour.price_per_person)}
              </span>
            )}
          </div>
          {tour.short_description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {tour.short_description}
            </p>
          )}
          {tour.theme && (
            <Badge variant="outline" className="mt-3 text-xs">
              {tour.theme}
            </Badge>
          )}
        </div>
      </article>
    </Link>
  );
}
