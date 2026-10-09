/**
 * Deals a venue can copy instead of inventing one (Ben, 9 Oct). Every example passes the listing rule:
 * food or wellness, no drink deal, and a saving of 25% or more (CLAUDE.md "What we list").
 */
const EXAMPLES: Record<string, string[]> = {
  cafe: ["Free coffee with any breakfast before 10am", "2-for-1 smoothie bowls, Mon–Wed", "30% off all cakes after 4pm"],
  restaurant: ["2-for-1 mains on Tuesday nights", "30% off the set lunch, weekdays", "Kids eat free at lunch"],
  warung: ["Free dessert with any nasi campur", "30% off the set lunch, weekdays", "2-for-1 mains after 8pm"],
  bakery: ["Half price on bread and pastries after 5pm", "Free coffee with any breakfast before 10am", "Buy 2 cakes, get 1 free"],
  spa: ["30% off massages before noon, weekdays", "Free foot scrub with any 90-minute massage", "Second treatment half price"],
  yoga: ["First class free", "Free class with any 5-class card", "30% off a 10-class card this month"],
  bar: ["Half-price food before 6pm", "2-for-1 mains on Mondays", "30% off the sharing platters, weekdays"],
};

export function dealExamples(category: string | null): string[] {
  const c = (category ?? "").toLowerCase();
  const key = Object.keys(EXAMPLES).find((k) => c.includes(k)) ?? (/(coffee|juice|bowl)/.test(c) ? "cafe" : /(massage|wellness|beauty)/.test(c) ? "spa" : "restaurant");
  return EXAMPLES[key];
}
