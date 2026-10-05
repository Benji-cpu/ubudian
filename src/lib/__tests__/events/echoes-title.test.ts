import { describe, expect, it } from "vitest";
import { echoesTitle } from "@/lib/events/echoes-title";

describe("echoesTitle", () => {
  it("treats empty, identical and prefix summaries as echoes", () => {
    expect(echoesTitle(null, "Tea Ceremony")).toBe(true);
    expect(echoesTitle("Tea Ceremony", "Tea Ceremony")).toBe(true);
    expect(echoesTitle("Kundalini Dance", "Kundalini Dance: Journey Through the Seven Chakras")).toBe(true);
  });

  it("treats a reworded short version of the title as an echo", () => {
    expect(
      echoesTitle("Kundalini Dance: Chakra Journey w/ Audilia", "Kundalini Dance: Journey Through the Seven Chakras w/ Audilia"),
    ).toBe(true);
  });

  it("keeps a real description", () => {
    expect(
      echoesTitle("Daily tea ceremony at Dragon Tea Temple. Tea is a practice and a way of life.", "Tea Ceremony"),
    ).toBe(false);
  });
});
