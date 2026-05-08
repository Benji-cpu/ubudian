import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Fragment } from "react";
import {
  parseShortcodes,
  type ParsedNode,
  type ResolvedRefs,
  lookupResolved,
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
 * - Inline shortcodes (no modifier) are pre-replaced with markdown links
 *   `[Title](href)` so they flow naturally inside ReactMarkdown — the custom <a>
 *   handler styles them.
 * - Unresolved entities fall back to styled italic text — never broken links.
 */
export function GuideMarkdown({ body, resolved, variant = "intent" }: GuideMarkdownProps) {
  const proseClass =
    variant === "intent"
      ? "prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-deep-green prose-headings:font-medium prose-h2:mt-14 prose-h2:mb-6 prose-h2:text-3xl prose-h3:mt-10 prose-h3:text-xl prose-p:text-brand-charcoal-light prose-p:leading-[1.85] prose-p:text-[1.05rem] prose-blockquote:not-italic prose-blockquote:border-l-0 prose-blockquote:px-0 prose-blockquote:py-2 prose-blockquote:font-serif prose-blockquote:text-2xl prose-blockquote:text-brand-deep-green sm:prose-blockquote:text-3xl prose-blockquote:leading-snug prose-blockquote:font-medium prose-blockquote:text-center prose-blockquote:my-12 prose-strong:text-brand-deep-green prose-em:italic prose-em:text-brand-charcoal-light prose-img:rounded-sm prose-img:my-10 prose-li:text-brand-charcoal-light prose-li:leading-relaxed"
      : "prose prose-base max-w-none prose-headings:font-serif prose-headings:text-brand-deep-green prose-headings:font-medium prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl prose-h3:mt-8 prose-h3:text-lg prose-p:text-brand-charcoal prose-p:leading-relaxed prose-blockquote:border-l-2 prose-blockquote:border-brand-gold/40 prose-blockquote:py-1 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-brand-charcoal-light prose-strong:text-brand-deep-green prose-img:rounded-sm prose-li:text-brand-charcoal";

  const segments = splitIntoSegments(body, resolved);

  return (
    <div className={proseClass}>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {seg.kind === "card" ? (
            <ShortcodeCard node={seg.node} resolved={resolved} />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  // Sentinel-prefixed hrefs are inline shortcodes — render via the styled link.
                  if (typeof href === "string" && href.startsWith("__sc__:")) {
                    const [, kind, slug] = href.split(":");
                    return (
                      <ShortcodeInlineLink
                        node={{
                          type: "shortcode",
                          kind: kind as never,
                          slug,
                          modifier: null,
                        }}
                        resolved={resolved}
                      />
                    );
                  }
                  const isExternal =
                    typeof href === "string" &&
                    /^https?:\/\//.test(href);
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
                },
                hr: () => (
                  <div className="my-12 flex justify-center">
                    <span className="h-px w-12 bg-brand-gold/40" aria-hidden />
                  </div>
                ),
              }}
            >
              {seg.markdown}
            </ReactMarkdown>
          )}
        </Fragment>
      ))}
    </div>
  );
}

type Segment =
  | { kind: "markdown"; markdown: string }
  | { kind: "card"; node: Extract<ParsedNode, { type: "shortcode" }> };

function splitIntoSegments(body: string, _resolved: ResolvedRefs): Segment[] {
  const nodes = parseShortcodes(body);
  const segments: Segment[] = [];
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
    // Inline shortcode → encode as a markdown link with a sentinel href.
    buffer += `[${node.slug}](__sc__:${node.kind}:${node.slug})`;
  }
  flush();

  return segments;
}
