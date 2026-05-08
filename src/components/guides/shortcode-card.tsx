import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type {
  ParsedNode,
  ResolvedRefs,
  ShortcodeNode,
} from "@/lib/guides/shortcodes";
import { lookupResolved } from "@/lib/guides/shortcodes";
import type { GuideShortcodeKind } from "@/types";

const KIND_LABEL: Record<GuideShortcodeKind, string> = {
  event: "Event",
  practitioner: "Practitioner",
  place: "Place",
  partner: "Partner",
  story: "Story",
  retreat: "Retreat",
};

export function ShortcodeInlineLink({
  node,
  resolved,
}: {
  node: ShortcodeNode;
  resolved: ResolvedRefs;
}) {
  const entity = lookupResolved(resolved, node.kind, node.slug);
  if (!entity) {
    // Graceful fallback — render as styled italic span; never a broken link.
    return (
      <span className="font-medium italic text-brand-charcoal-light">
        {node.slug.replace(/-/g, " ")}
      </span>
    );
  }
  return (
    <Link
      href={entity.href}
      className="font-medium text-brand-deep-green underline decoration-brand-gold/60 decoration-1 underline-offset-[5px] transition-colors hover:text-primary hover:decoration-brand-gold"
    >
      {entity.title}
    </Link>
  );
}

export function ShortcodeCard({
  node,
  resolved,
}: {
  node: ShortcodeNode;
  resolved: ResolvedRefs;
}) {
  const entity = lookupResolved(resolved, node.kind, node.slug);
  if (!entity) return null;

  return (
    <Link
      href={entity.href}
      className="not-prose group my-10 block overflow-hidden rounded-sm border border-brand-gold/15 bg-brand-cream/40 transition-all duration-300 hover:border-brand-gold/40 hover:shadow-sm"
    >
      <div className="grid gap-0 sm:grid-cols-[1fr_2fr]">
        {entity.imageUrl ? (
          <div className="relative aspect-[4/3] w-full sm:aspect-auto">
            <Image
              src={entity.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-brand-cream sm:aspect-auto" />
        )}
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
            {KIND_LABEL[node.kind]}
          </p>
          <h4 className="mt-3 font-serif text-xl font-medium leading-snug text-brand-deep-green sm:text-2xl">
            {entity.title}
          </h4>
          {entity.subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-brand-charcoal-light line-clamp-2">
              {entity.subtitle}
            </p>
          )}
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-brand-deep-green/70 transition-transform duration-300 group-hover:translate-x-1">
            View {KIND_LABEL[node.kind].toLowerCase()}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ShortcodeNodeRenderer({
  node,
  resolved,
}: {
  node: ParsedNode;
  resolved: ResolvedRefs;
}) {
  if (node.type !== "shortcode") return null;
  if (node.modifier === "card") {
    return <ShortcodeCard node={node} resolved={resolved} />;
  }
  return <ShortcodeInlineLink node={node} resolved={resolved} />;
}
