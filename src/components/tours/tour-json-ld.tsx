import type { Tour } from "@/types";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

interface TourJsonLdProps {
  tour: Tour;
}

export function TourJsonLd({ tour }: TourJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.short_description || tour.description?.slice(0, 200),
    url: `${SITE_URL}/tours/${tour.slug}`,
    ...(tour.photo_urls?.[0] && { image: tour.photo_urls[0] }),
    ...(tour.itinerary && { itinerary: tour.itinerary.slice(0, 500) }),
    touristType: tour.theme || "General",
    provider: {
      "@type": "Organization",
      name: tour.guide_name || SITE_NAME,
      url: SITE_URL,
    },
    ...(tour.price_per_person && {
      offers: {
        "@type": "Offer",
        price: (tour.price_per_person / 100).toFixed(2),
        priceCurrency: "USD",
        url: `${SITE_URL}/tours/${tour.slug}`,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
