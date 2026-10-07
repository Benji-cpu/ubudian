import { describe, expect, it } from "vitest";
import { tidyShortDescription } from "@/lib/events/summary";

describe("tidyShortDescription", () => {
  const description =
    "Practice and Composition. An exploration of dance technique through the pores of the body and the rhythms of Brazil.";

  it("ends a mid-word slice at the last whole word", () => {
    expect(tidyShortDescription(description.slice(0, 64), description)).toBe(
      "Practice and Composition. An exploration of dance technique…",
    );
  });

  it("prefers the last full sentence when it is long enough", () => {
    const long = "A long opening sentence that runs well past sixty characters in all. Then more text here";
    expect(tidyShortDescription(long.slice(0, 80), `${long} and beyond`)).toBe(
      "A long opening sentence that runs well past sixty characters in all.",
    );
  });

  it("leaves a summary that is not a slice alone", () => {
    expect(tidyShortDescription("Weekly ecstatic dance", description)).toBe("Weekly ecstatic dance");
  });

  it("leaves a slice that ends on a word boundary alone", () => {
    const s = description.slice(0, 24); // "Practice and Composition"
    expect(tidyShortDescription(s, description)).toBe(s);
  });

  it("handles nulls", () => {
    expect(tidyShortDescription(null, description)).toBeNull();
  });
});
