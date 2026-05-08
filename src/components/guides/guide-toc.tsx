import type { TocEntry } from "@/lib/guides/toc";

interface GuideTocProps {
  entries: TocEntry[];
}

export function GuideToc({ entries }: GuideTocProps) {
  if (entries.length < 2) return null;

  return (
    <nav
      aria-label="In this guide"
      className="border-y border-brand-gold/15 bg-brand-cream/40 backdrop-blur md:sticky md:top-16 md:z-10"
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-brand-charcoal/55 md:mb-2">
          In this guide
        </p>
        <ul className="-mx-1 flex flex-wrap gap-x-1 gap-y-2 md:flex-nowrap md:overflow-x-auto md:flex-row md:gap-2 md:whitespace-nowrap">
          {entries.map((entry) => (
            <li key={entry.id} className="md:shrink-0">
              <a
                href={`#${entry.id}`}
                className="inline-block rounded-full px-3 py-1.5 text-xs text-brand-charcoal-light transition-colors hover:bg-brand-deep-green/5 hover:text-brand-deep-green"
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
