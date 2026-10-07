/**
 * Harvesters build a card's short description by slicing the full description
 * at 200 characters, which leaves "…through the po" on the card. When the
 * summary is a cut-off start of the description, end it at the last full
 * sentence, or else at the last whole word with an ellipsis. Summaries that
 * aren't a slice of the description (the LLM's own, a title) pass through.
 */
export function tidyShortDescription(summary: string | null, description: string | null): string | null {
  if (!summary) return null;
  const flat = (s: string) => s.replace(/\s+/g, " ").trim();
  const sd = flat(summary).replace(/…$/, "");
  const full = flat(description ?? "");
  if (!sd) return null;
  const at = full.indexOf(sd);
  const next = at >= 0 ? full[at + sd.length] : undefined;
  const cutMidWord = next !== undefined && /[\p{L}\p{N}]/u.test(next) && /[\p{L}\p{N}]$/u.test(sd);
  const endedOnEllipsis = /[\p{L}\p{N}]…$/u.test(flat(summary));
  if (!cutMidWord && !endedOnEllipsis) return summary;

  const sentenceEnd = Math.max(sd.lastIndexOf(". "), sd.lastIndexOf("! "), sd.lastIndexOf("? "));
  if (sentenceEnd >= 60) return sd.slice(0, sentenceEnd + 1);
  const wordEnd = sd.lastIndexOf(" ");
  if (wordEnd < 20) return sd;
  return `${sd.slice(0, wordEnd).replace(/[\s,;:–-]+$/, "")}…`;
}
