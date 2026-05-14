import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { GuideShortcodeKind, Guide } from "@/types";

interface MentionedInGuidesProps {
  refKind: GuideShortcodeKind;
  refSlug: string;
  /** Tonal variant — "deep" for cream-on-deep-green sections, "light" for cream backgrounds. */
  tone?: "deep" | "light";
}

export async function MentionedInGuides({
  refKind,
  refSlug,
  tone = "light",
}: MentionedInGuidesProps) {
  let guides: Guide[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("guide_entity_references")
      .select("guide_id, position, guides(*)")
      .eq("ref_kind", refKind)
      .eq("ref_slug", refSlug)
      .order("position", { ascending: true });

    guides = ((data ?? []) as unknown as Array<{ guides: Guide | null }>)
      .map((row) => row.guides)
      .filter((g): g is Guide => Boolean(g) && g!.status === "published")
      .slice(0, 3);
  } catch {
    return null;
  }

  if (guides.length === 0) return null;

  const sectionClass =
    tone === "deep"
      ? "border-y border-brand-gold/30 bg-brand-deep-green/95 text-brand-cream"
      : "border-y border-brand-gold/15 bg-brand-cream/40";

  const eyebrowColor = "text-brand-gold";
  const titleColor =
    tone === "deep" ? "text-brand-cream" : "text-brand-deep-green";
  const subtitleColor =
    tone === "deep" ? "text-brand-cream/75" : "text-brand-charcoal-light";
  const cardClass =
    tone === "deep"
      ? "block rounded-sm border border-brand-cream/10 bg-brand-deep-green/40 p-6 backdrop-blur-sm transition-colors hover:border-brand-gold/40"
      : "block rounded-sm border border-brand-gold/15 bg-card p-6 transition-all hover:border-brand-gold/40 hover:shadow-sm";

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8">
          <p className={`text-[11px] uppercase tracking-[0.22em] ${eyebrowColor}`}>
            Mentioned in
          </p>
          <h2 className={`mt-2 font-serif text-2xl font-medium sm:text-3xl ${titleColor}`}>
            {guides.length === 1 ? "A guide that talks about this" : "Guides that talk about this"}
          </h2>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <li key={g.id}>
              <Link href={`/guides/${g.slug}`} className={`group ${cardClass}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold">
                  {g.tier === "intent" ? "Why You Came" : "Survival Guide"}
                </p>
                <h3 className={`mt-3 font-serif text-lg font-medium leading-snug ${titleColor}`}>
                  {g.title}
                </h3>
                {g.subtitle && (
                  <p className={`mt-2 text-sm leading-relaxed line-clamp-2 ${subtitleColor}`}>
                    {g.subtitle}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-brand-gold transition-transform group-hover:translate-x-1">
                  Read
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
