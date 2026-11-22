import { describe, expect, it } from "vitest";
import { absoluteImageUrl } from "@/lib/ingestion/image-url";

describe("absoluteImageUrl", () => {
  it("keeps absolute http and https URLs", () => {
    expect(absoluteImageUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(absoluteImageUrl(" http://example.com/a.png ")).toBe("http://example.com/a.png");
  });

  it("drops site-relative placeholders and non-strings", () => {
    expect(absoluteImageUrl("/images/cover.png")).toBeNull();
    expect(absoluteImageUrl("images/cover.png")).toBeNull();
    expect(absoluteImageUrl("")).toBeNull();
    expect(absoluteImageUrl(null)).toBeNull();
    expect(absoluteImageUrl(undefined)).toBeNull();
  });
});
