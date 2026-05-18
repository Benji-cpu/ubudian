import Link from "next/link";
import type { Sponsor } from "@/types";

interface PartnerCreditProps {
  sponsor: Pick<Sponsor, "name" | "slug">;
  /**
   * Editorial verb. Defaults to "In partnership with" which fits most surfaces.
   * Use "This edition held by" for newsletter, "Brought to you by" for categories.
   */
  verb?: string;
  className?: string;
}

/**
 * Inline editorial credit — never a banner, never a CTA, never "Sponsored".
 * Matches the membership-page register: serif italic, brand-gold underline, no chrome.
 */
export function PartnerCredit({
  sponsor,
  verb = "In partnership with",
  className,
}: PartnerCreditProps) {
  return (
    <p
      className={
        "font-serif text-sm italic leading-relaxed text-muted-foreground" +
        (className ? ` ${className}` : "")
      }
    >
      {verb}{" "}
      <Link
        href={`/community/partners/${sponsor.slug}`}
        className="not-italic text-brand-deep-green underline decoration-brand-gold/40 underline-offset-4 transition-colors hover:decoration-brand-gold"
      >
        {sponsor.name}
      </Link>
    </p>
  );
}
