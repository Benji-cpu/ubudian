import { describe, it, expect } from "vitest";
import { extractToc } from "@/lib/guides/toc";

describe("extractToc", () => {
  it("returns an empty array when no H2s present", () => {
    expect(extractToc("Just a paragraph.")).toEqual([]);
    expect(extractToc("# Top heading only\n\nbody")).toEqual([]);
    expect(extractToc("")).toEqual([]);
  });

  it("extracts H2s with slugified ids", () => {
    const body = "intro\n\n## Where they wait\n\nbody\n\n## What to actually pay";
    expect(extractToc(body)).toEqual([
      { id: "where-they-wait", text: "Where they wait" },
      { id: "what-to-actually-pay", text: "What to actually pay" },
    ]);
  });

  it("ignores H1 and H3+", () => {
    const body = "# H1\n## H2\n### H3\n#### H4";
    expect(extractToc(body)).toEqual([{ id: "h2", text: "H2" }]);
  });

  it("ignores H2-looking lines inside fenced code blocks", () => {
    const body = "## Real one\n\n```\n## Not a heading\n```\n\n## After";
    expect(extractToc(body)).toEqual([
      { id: "real-one", text: "Real one" },
      { id: "after", text: "After" },
    ]);
  });

  it("disambiguates duplicate headings", () => {
    const body = "## Setup\n\n## Setup\n\n## Setup";
    expect(extractToc(body)).toEqual([
      { id: "setup", text: "Setup" },
      { id: "setup-2", text: "Setup" },
      { id: "setup-3", text: "Setup" },
    ]);
  });

  it("strips trailing closing hashes (atx style)", () => {
    expect(extractToc("## Heading ##")).toEqual([
      { id: "heading", text: "Heading" },
    ]);
  });
});
