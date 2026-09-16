import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import { GuideMarkdown } from "@/components/guides/guide-markdown";
import type { ResolvedRefs } from "@/lib/guides/shortcodes";

/**
 * This renders. The shortcode PARSER was well covered and correct, and the bug
 * lived entirely past it: the parser's output was handed to react-markdown as
 * `[slug](__sc__:kind:slug)`, whose pseudo-scheme the URL sanitiser stripped,
 * so the <a> handler never recognised it and rendered the link text — the raw
 * slug — into the prose. Nothing short of rendering could see that, which is
 * why it reached production and stayed there.
 */
describe("GuideMarkdown inline shortcodes", () => {
  const resolved: ResolvedRefs = new Map([
    [
      "place:yellow-flower-cafe",
      {
        kind: "place" as const,
        slug: "yellow-flower-cafe",
        title: "Yellow Flower Café",
        subtitle: null,
        href: "/places/yellow-flower-cafe",
        imageUrl: null,
      },
    ],
  ]);

  it("renders a resolved shortcode as its title and links to it, never as the slug", () => {
    const { container } = render(
      <GuideMarkdown
        body="Start at {{place:yellow-flower-cafe}} on a Wednesday."
        resolved={resolved}
      />,
    );
    const link = within(container).getByRole("link", { name: "Yellow Flower Café" });
    expect(link).toHaveAttribute("href", "/places/yellow-flower-cafe");
    expect(container.textContent).not.toContain("yellow-flower-cafe");
    expect(container.textContent).toContain("Start at");
    expect(container.textContent).toContain("on a Wednesday.");
  });

  it("falls back to plain text for an unresolved shortcode, and still never leaks the slug verbatim", () => {
    const { container } = render(
      <GuideMarkdown
        body="Look for {{event:some-event-that-has-since-expired}} tonight."
        resolved={new Map()}
      />,
    );
    // No link, and the hyphenated slug must not survive into the prose.
    expect(within(container).queryByRole("link")).toBeNull();
    expect(container.textContent).not.toContain("some-event-that-has-since-expired");
    expect(container.textContent).toContain("Look for");
  });
});
