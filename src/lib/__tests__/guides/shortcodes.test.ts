import { describe, it, expect } from "vitest";
import { parseShortcodes } from "@/lib/guides/shortcodes";

describe("parseShortcodes", () => {
  it("returns empty array for empty input", () => {
    expect(parseShortcodes("")).toEqual([]);
  });

  it("returns a single text node when no shortcodes present", () => {
    expect(parseShortcodes("Just plain text.")).toEqual([
      { type: "text", value: "Just plain text." },
    ]);
  });

  it("parses a single inline shortcode", () => {
    const out = parseShortcodes("Visit {{event:tuesday-cacao}} this week.");
    expect(out).toEqual([
      { type: "text", value: "Visit " },
      { type: "shortcode", kind: "event", slug: "tuesday-cacao", modifier: null },
      { type: "text", value: " this week." },
    ]);
  });

  it("parses a card-modifier shortcode", () => {
    const out = parseShortcodes("Body. {{retreat:embodiment-week|card}} more.");
    expect(out).toHaveLength(3);
    expect(out[1]).toEqual({
      type: "shortcode",
      kind: "retreat",
      slug: "embodiment-week",
      modifier: "card",
    });
  });

  it("parses multiple shortcodes in one string", () => {
    const out = parseShortcodes(
      "{{event:a}} and {{practitioner:b}} together {{place:c}}."
    );
    const shortcodes = out.filter((n) => n.type === "shortcode");
    expect(shortcodes).toHaveLength(3);
    expect(shortcodes.map((s) => s.type === "shortcode" && s.slug)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("treats unknown kinds as plain text", () => {
    const out = parseShortcodes("Hello {{unknown:foo}} world.");
    expect(out).toEqual([{ type: "text", value: "Hello {{unknown:foo}} world." }]);
  });

  it("handles malformed shortcodes by emitting them as text", () => {
    const out = parseShortcodes("Half {{open and {{event:x}} close.");
    const shortcodes = out.filter((n) => n.type === "shortcode");
    expect(shortcodes).toHaveLength(1);
    expect(shortcodes[0]).toMatchObject({ kind: "event", slug: "x" });
  });

  it("supports all six shortcode kinds", () => {
    const input =
      "{{event:e}} {{practitioner:p}} {{place:pl}} {{partner:pa}} {{story:s}} {{retreat:r}}";
    const out = parseShortcodes(input);
    const kinds = out
      .filter((n) => n.type === "shortcode")
      .map((n) => n.type === "shortcode" && n.kind);
    expect(kinds).toEqual([
      "event",
      "practitioner",
      "place",
      "partner",
      "story",
      "retreat",
    ]);
  });

  it("rejects slugs with disallowed characters", () => {
    const out = parseShortcodes("Hi {{event:Bad Slug!}} bye.");
    expect(out).toEqual([{ type: "text", value: "Hi {{event:Bad Slug!}} bye." }]);
  });

  it("preserves text on either side of a shortcode at edges", () => {
    expect(parseShortcodes("{{event:start}}rest")).toEqual([
      { type: "shortcode", kind: "event", slug: "start", modifier: null },
      { type: "text", value: "rest" },
    ]);
    expect(parseShortcodes("rest{{event:end}}")).toEqual([
      { type: "text", value: "rest" },
      { type: "shortcode", kind: "event", slug: "end", modifier: null },
    ]);
  });
});

describe("collectShortcodeRefs", () => {
  it("dedupes by kind+slug", async () => {
    const { collectShortcodeRefs } = await import("@/lib/guides/shortcodes");
    const nodes = parseShortcodes(
      "{{event:a}} text {{event:a|card}} more {{practitioner:a}}"
    );
    expect(collectShortcodeRefs(nodes)).toEqual([
      { kind: "event", slug: "a" },
      { kind: "practitioner", slug: "a" },
    ]);
  });
});
