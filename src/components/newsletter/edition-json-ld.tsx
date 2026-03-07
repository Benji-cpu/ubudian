import type { NewsletterEdition } from "@/types";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

interface EditionJsonLdProps {
  edition: NewsletterEdition;
}

export function EditionJsonLd({ edition }: EditionJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: edition.subject,
    ...(edition.preview_text && { description: edition.preview_text }),
    url: `${SITE_URL}/newsletter/${edition.slug}`,
    datePublished: edition.sent_at || edition.created_at,
    dateModified: edition.updated_at,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/newsletter/${edition.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
