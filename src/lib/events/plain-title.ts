/**
 * An event title in plain letters. Instagram captions style titles with
 * Unicode "mathematical" bold or italic letters ("𝗧𝗛𝗘 𝗔𝗡𝗧𝗜𝗗𝗢𝗧𝗘"), which
 * screen readers read letter by letter, search can't match and our serif
 * font can't draw. NFKC folds them, and full-width or script letters, to
 * plain ones ("THE ANTIDOTE"); emoji and accented letters are unchanged.
 */
export function plainTitle(title: string): string {
  return title.normalize("NFKC");
}

/** The same row with its title in plain letters; the row itself when nothing changes. */
export function withPlainTitle<T>(row: T): T {
  const title = (row as { title?: unknown }).title;
  if (typeof title !== "string") return row;
  const plain = plainTitle(title);
  return plain === title ? row : { ...row, title: plain };
}
