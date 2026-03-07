import Link from "next/link";
import { format } from "date-fns";
import type { NewsletterEdition } from "@/types";

interface EditionCardProps {
  edition: NewsletterEdition;
}

export function EditionCard({ edition }: EditionCardProps) {
  return (
    <Link href={`/newsletter/${edition.slug}`} className="group block">
      <article className="rounded-sm border border-brand-gold/10 bg-card p-6 transition-shadow hover:shadow-md">
        <time className="text-xs text-muted-foreground">
          {format(
            new Date(edition.sent_at || edition.created_at),
            "MMMM d, yyyy"
          )}
        </time>
        <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {edition.subject}
        </h3>
        {edition.preview_text && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {edition.preview_text}
          </p>
        )}
      </article>
    </Link>
  );
}
