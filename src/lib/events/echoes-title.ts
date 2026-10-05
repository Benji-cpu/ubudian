/**
 * True when a listing's summary only repeats its title, so the card should not
 * print it as a second line. Harvested listings often mirror, truncate or
 * reword the title ("Kundalini Dance: Journey Through the Seven Chakras w/
 * Audilia" → "Kundalini Dance: Chakra Journey w/ Audilia").
 *
 * Rule: empty, a prefix either way, or at least 80% of the summary's words
 * (plural-insensitive) already in the title.
 */
export function echoesTitle(summary: string | null | undefined, title: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const a = norm(summary ?? "");
  const b = norm(title);
  if (!a || b.startsWith(a) || a.startsWith(b)) return true;
  const stem = (w: string) => w.replace(/s$/, "");
  const titleWords = new Set(b.split(" ").map(stem));
  const words = a.split(" ").map(stem);
  const shared = words.filter((w) => titleWords.has(w)).length;
  return words.length <= 12 && shared / words.length >= 0.8;
}
