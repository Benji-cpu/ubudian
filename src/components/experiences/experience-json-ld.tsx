import type { Experience } from "@/types";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

interface ExperienceJsonLdProps {
  experience: Experience;
}

export function ExperienceJsonLd({ experience }: ExperienceJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: experience.title,
    description: experience.short_description || experience.description?.slice(0, 200),
    url: `${SITE_URL}/experiences/${experience.slug}`,
    ...(experience.cover_image_url && { image: experience.cover_image_url }),
    touristType: experience.category,
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ubud",
      addressRegion: "Bali",
      addressCountry: "ID",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
