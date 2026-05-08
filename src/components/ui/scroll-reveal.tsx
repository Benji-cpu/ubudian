import { createElement } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "article";
}

/**
 * Pure CSS-driven reveal. Default state is visible — the animation is
 * additive on browsers that support `animation-timeline: view()` and is
 * gated by `prefers-reduced-motion`. SSR, crawlers, and full-page
 * screenshots see fully-rendered content.
 *
 * `delayMs` shifts the entrance via animation-delay on supporting browsers.
 */
export function ScrollReveal({
  children,
  delayMs = 0,
  className = "",
  as = "div",
}: ScrollRevealProps) {
  return createElement(
    as,
    {
      className: `retreat-reveal ${className}`,
      style: delayMs ? { animationDelay: `${delayMs}ms` } : undefined,
    },
    children
  );
}
