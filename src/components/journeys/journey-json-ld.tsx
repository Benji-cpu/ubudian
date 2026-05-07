import type { Journey } from "@/types";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

interface JourneyJsonLdProps {
  journey: Journey;
}

export function JourneyJsonLd({ journey }: JourneyJsonLdProps) {
  const url = `${SITE_URL}/experiences/${journey.slug}`;
  const description = journey.summary || journey.subtitle || undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: journey.title,
    ...(description && { description }),
    ...(journey.cover_image_url && { image: journey.cover_image_url }),
    url,
    datePublished: journey.created_at,
    dateModified: journey.updated_at,
    keywords: ["Ubud retreat", "Bali retreat", `${journey.length_days}-day retreat`, ...(journey.archetype_tags ?? [])].join(", "),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
