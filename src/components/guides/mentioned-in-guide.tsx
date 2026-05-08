import Link from "next/link";
import Image from "next/image";
import type { ResolvedRefs } from "@/lib/guides/shortcodes";
import type { GuideShortcodeKind } from "@/types";

const KIND_LABEL: Record<GuideShortcodeKind, string> = {
  event: "Event",
  practitioner: "Practitioner",
  place: "Place",
  partner: "Partner",
  story: "Story",
  retreat: "Retreat",
};

interface MentionedInGuideProps {
  resolved: ResolvedRefs;
}

export function MentionedInGuide({ resolved }: MentionedInGuideProps) {
  const entities = Array.from(resolved.values()).filter(
    (e): e is NonNullable<typeof e> => Boolean(e),
  );

  if (entities.length === 0) return null;

  return (
    <section className="border-t border-brand-gold/15 bg-brand-cream/40 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
            Mentioned in this guide
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
            Where to go from here
          </h2>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <li key={`${entity.kind}:${entity.slug}`}>
              <Link
                href={entity.href}
                className="group block h-full overflow-hidden rounded-sm border border-brand-gold/10 bg-card transition-all duration-300 hover:border-brand-gold/40 hover:shadow-sm"
              >
                {entity.imageUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={entity.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] w-full bg-brand-cream" />
                )}
                <div className="p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold">
                    {KIND_LABEL[entity.kind as GuideShortcodeKind]}
                  </p>
                  <h3 className="mt-2 font-serif text-base font-medium leading-snug text-brand-deep-green group-hover:text-primary">
                    {entity.title}
                  </h3>
                  {entity.subtitle && (
                    <p className="mt-1.5 text-sm leading-snug text-brand-charcoal-light line-clamp-2">
                      {entity.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
