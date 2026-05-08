import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Clock } from "lucide-react";
import { GuideMarkdown } from "@/components/guides/guide-markdown";
import type { Guide } from "@/types";
import type { ResolvedRefs } from "@/lib/guides/shortcodes";

interface PracticalGuideProps {
  guide: Guide;
  resolved: ResolvedRefs;
}

function formatLastUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PracticalGuide({ guide, resolved }: PracticalGuideProps) {
  const updatedAt = formatLastUpdated(guide.last_updated_at) ?? formatLastUpdated(guide.updated_at);

  return (
    <article className="bg-white">
      {/* Slim hero */}
      <header className="border-b border-brand-gold/15 bg-brand-cream/40">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-brand-charcoal/60 transition-colors hover:text-brand-deep-green"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Survival Guide
          </Link>

          <div className="mt-8 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h1 className="font-serif text-3xl font-medium leading-[1.15] text-brand-deep-green sm:text-4xl md:text-5xl">
                {guide.title}
              </h1>
              {guide.subtitle && (
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-charcoal-light sm:text-xl">
                  {guide.subtitle}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em] text-brand-charcoal/60">
                {updatedAt && (
                  <span>
                    <span className="text-brand-charcoal/40">Updated</span>{" "}
                    <span className="text-brand-deep-green">{updatedAt}</span>
                  </span>
                )}
                {guide.reading_time_min && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {guide.reading_time_min} min read
                  </span>
                )}
                {guide.field_tested_by && (
                  <span>
                    <span className="text-brand-charcoal/40">Field-tested by</span>{" "}
                    <span className="text-brand-deep-green">{guide.field_tested_by}</span>
                  </span>
                )}
              </div>
            </div>
            {guide.card_image_url && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm md:w-72 lg:w-80">
                <Image
                  src={guide.card_image_url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {guide.intro_md && (
          <div className="mb-12 border-l-2 border-brand-gold/40 pl-6">
            <p className="font-serif text-xl leading-relaxed text-brand-deep-green sm:text-2xl">
              {guide.intro_md}
            </p>
          </div>
        )}
        <GuideMarkdown body={guide.body_md} resolved={resolved} variant="practical" />
      </section>

      {/* Footer attribution */}
      <footer className="border-t border-brand-gold/15 bg-brand-cream/40 py-12">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-brand-charcoal-light">
            {guide.field_tested_by ? (
              <>
                Field-tested by{" "}
                <span className="font-medium text-brand-deep-green">
                  {guide.field_tested_by}
                </span>
                {updatedAt && <>. Last updated {updatedAt}.</>}
              </>
            ) : (
              updatedAt && <>Last updated {updatedAt}.</>
            )}
          </div>
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-brand-deep-green transition-colors hover:text-primary"
          >
            More guides
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </footer>
    </article>
  );
}
