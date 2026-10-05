import { describe, expect, it } from "vitest";
import { eventBlurb } from "@/lib/email/weekly-digest-email";

describe("eventBlurb", () => {
  it("prefers the short description", () => {
    expect(eventBlurb({ title: "Class", short_description: "A technical contact improvisation class. All levels.", description: "Long text." })).toBe(
      "A technical contact improvisation class."
    );
  });
  it("falls back to the first sentence of the description", () => {
    expect(eventBlurb({ title: "Class", short_description: null, description: "Weekly breathwork at Moksa. Bring water." })).toBe(
      "Weekly breathwork at Moksa."
    );
  });
  it("clips a long run-on and returns empty when there is nothing", () => {
    expect(eventBlurb({ title: "Class", short_description: null, description: "x".repeat(300) }).length).toBeLessThanOrEqual(140);
    expect(eventBlurb({ title: "Class", short_description: null, description: "" })).toBe("");
  });
});

describe("eventBlurb repeats", () => {
  it("is empty when the text only restates the title", () => {
    expect(eventBlurb({ title: "Cacao Ceremony & Medicine Song", short_description: "Cacao Ceremony & Medicine Song.", description: "" })).toBe("");
  });
  it("uses the description when the short one restates the title", () => {
    expect(
      eventBlurb({ title: "Lyre Sound Circle", short_description: "Lyre Sound Circle.", description: "An intuitive music session on the lyre. Bring a mat." })
    ).toBe("An intuitive music session on the lyre.");
  });
});
