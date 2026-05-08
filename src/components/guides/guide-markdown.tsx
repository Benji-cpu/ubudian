import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Fragment } from "react";
import { slugify } from "@/lib/utils";
import {
  parseShortcodes,
  type ParsedNode,
  type ResolvedRefs,
} from "@/lib/guides/shortcodes";
import { ShortcodeCard, ShortcodeInlineLink } from "@/components/guides/shortcode-card";

interface GuideMarkdownProps {
  body: string;
  resolved: ResolvedRefs;
  variant?: "practical" | "intent";
}

/**
 * Renders guide body markdown with shortcode support.
 *
 * Strategy:
 * - Card-modifier shortcodes (`{{event:slug|card}}`) are block-level — they split the
 *   body into segments, with cards rendered between markdown chunks.
 * - Inline shortcodes (no modifier) are pre-replaced with a sentinel-href markdown
 *   link `[slug](__sc__:kind:slug)` so they flow naturally inside ReactMarkdown — the
 *   custom <a> handler detects the sentinel and styles them.
 * - Unresolved entities fall back to styled italic text — never broken links.
 */
export function GuideMarkdown({
  body,
  resolved,
  variant = "intent",
}: GuideMarkdownProps) {
  const segments = splitIntoSegments(body);

  const components: Components =
    variant === "intent" ? intentComponents(resolved) : practicalComponents(resolved);

  return (
    <div className="font-sans text-brand-charcoal-light">
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {seg.kind === "card" ? (
            <ShortcodeCard node={seg.node} resolved={resolved} />
          ) : seg.kind === "pullquote" ? (
            <PullQuote text={seg.text} variant={variant} />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {seg.markdown}
            </ReactMarkdown>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function PullQuote({
  text,
  variant,
}: {
  text: string;
  variant: "practical" | "intent";
}) {
  if (variant === "practical") {
    return (
      <blockquote className="my-10 border-l-2 border-brand-gold/50 pl-6 font-serif text-xl leading-snug text-brand-deep-green sm:text-2xl">
        {text}
      </blockquote>
    );
  }
  return (
    <blockquote className="my-14 border-y border-brand-gold/30 px-2 py-10 text-center font-serif text-2xl font-medium leading-snug text-brand-deep-green sm:text-3xl md:text-4xl">
      <span aria-hidden className="block pb-3 text-3xl text-brand-gold/70 sm:text-4xl">
        “
      </span>
      {text}
    </blockquote>
  );
}

function headingId(children: React.ReactNode): string | undefined {
  // Mirrors extractToc's slugify of the H2 plain text.
  const text = childrenToText(children).trim();
  if (!text) return undefined;
  return slugify(text);
}

function childrenToText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return childrenToText((node as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}

function inlineLinkRenderer(resolved: ResolvedRefs) {
  return function A({
    href,
    children,
  }: React.ComponentProps<"a">) {
    if (typeof href === "string" && href.startsWith("__sc__:")) {
      const [, kind, slug] = href.split(":");
      return (
        <ShortcodeInlineLink
          node={{ type: "shortcode", kind: kind as never, slug, modifier: null }}
          resolved={resolved}
        />
      );
    }
    const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-brand-deep-green underline decoration-brand-gold/60 underline-offset-[5px] transition-colors hover:text-primary hover:decoration-brand-gold"
      >
        {children}
      </a>
    );
  };
}

function intentComponents(resolved: ResolvedRefs): Components {
  return {
    a: inlineLinkRenderer(resolved),
    h2: ({ children }) => (
      <h2
        id={headingId(children)}
        className="scroll-mt-32 mt-16 mb-6 font-serif text-3xl font-medium leading-tight text-brand-deep-green sm:text-4xl"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-12 mb-4 font-serif text-xl font-medium text-brand-deep-green sm:text-2xl">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-10 mb-3 font-serif text-lg font-medium text-brand-deep-green">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="my-6 text-[1.05rem] leading-[1.85] text-brand-charcoal-light">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="my-6 list-disc space-y-2 pl-6 text-brand-charcoal-light">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-6 list-decimal space-y-2 pl-6 text-brand-charcoal-light">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-12 border-y border-brand-gold/30 px-2 py-8 text-center font-serif text-2xl font-medium leading-snug text-brand-deep-green sm:text-3xl">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-brand-deep-green">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-brand-charcoal-light">{children}</em>
    ),
    hr: () => (
      <div className="my-14 flex justify-center" aria-hidden>
        <span className="h-px w-12 bg-brand-gold/40" />
      </div>
    ),
  };
}

function practicalComponents(resolved: ResolvedRefs): Components {
  return {
    a: inlineLinkRenderer(resolved),
    h2: ({ children }) => (
      <h2
        id={headingId(children)}
        className="scroll-mt-32 mt-14 mb-5 border-t border-brand-gold/25 pt-10 font-serif text-2xl font-medium tracking-tight text-brand-deep-green sm:text-3xl"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 mb-3 font-serif text-lg font-semibold text-brand-deep-green sm:text-xl">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-8 mb-2 font-serif text-base font-semibold text-brand-deep-green">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="my-5 leading-[1.75] text-brand-charcoal">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="my-5 list-disc space-y-2 pl-6 text-brand-charcoal">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-5 list-decimal space-y-2 pl-6 text-brand-charcoal">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-brand-gold/40 py-1 pl-5 italic text-brand-charcoal-light">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-brand-deep-green">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => (
      <div className="my-10 flex justify-center" aria-hidden>
        <span className="h-px w-10 bg-brand-gold/40" />
      </div>
    ),
  };
}

type Segment =
  | { kind: "markdown"; markdown: string }
  | { kind: "card"; node: Extract<ParsedNode, { type: "shortcode" }> }
  | { kind: "pullquote"; text: string };

const PULLQUOTE_RE = /\{\{pullquote\}\}([\s\S]*?)\{\{\/pullquote\}\}/g;

function splitIntoSegments(body: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of body.matchAll(PULLQUOTE_RE)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      pushChunk(segments, body.slice(cursor, start));
    }
    segments.push({ kind: "pullquote", text: match[1].trim() });
    cursor = start + match[0].length;
  }
  if (cursor < body.length) {
    pushChunk(segments, body.slice(cursor));
  }
  if (segments.length === 0) {
    pushChunk(segments, body);
  }
  return segments;
}

function pushChunk(segments: Segment[], chunk: string) {
  const nodes = parseShortcodes(chunk);
  let buffer = "";
  const flush = () => {
    if (buffer.length > 0) {
      segments.push({ kind: "markdown", markdown: buffer });
      buffer = "";
    }
  };
  for (const node of nodes) {
    if (node.type === "text") {
      buffer += node.value;
      continue;
    }
    if (node.modifier === "card") {
      flush();
      segments.push({ kind: "card", node });
      continue;
    }
    buffer += `[${node.slug}](__sc__:${node.kind}:${node.slug})`;
  }
  flush();
}
