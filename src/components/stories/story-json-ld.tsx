import type { Story } from "@/types";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

interface StoryJsonLdProps {
  story: Story;
}

export function StoryJsonLd({ story }: StoryJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    ...(story.subject_tagline && { description: story.subject_tagline }),
    ...(story.photo_urls?.[0] && { image: story.photo_urls[0] }),
    url: `${SITE_URL}/stories/${story.slug}`,
    datePublished: story.published_at || story.created_at,
    dateModified: story.updated_at,
    author: {
      "@type": "Person",
      name: story.subject_name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/stories/${story.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
