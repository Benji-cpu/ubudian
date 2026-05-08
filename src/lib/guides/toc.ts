import { slugify } from "@/lib/utils";

export interface TocEntry {
  id: string;
  text: string;
}

/**
 * Extract H2 headings from a guide markdown body. Returns ordered, deduped
 * entries with slugified anchor ids matching what the renderer applies to
 * the rendered <h2 id="…">. Skips H2s inside fenced code blocks.
 */
export function extractToc(body: string): TocEntry[] {
  if (!body) return [];

  const lines = body.split("\n");
  const entries: TocEntry[] = [];
  const seen = new Set<string>();
  let inCodeFence = false;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = /^##\s+(.+?)\s*#*\s*$/.exec(trimmed);
    if (!match) continue;

    const text = match[1].trim();
    let id = slugify(text);
    if (!id) continue;

    // Disambiguate duplicates by appending an incrementing suffix.
    let n = 2;
    let candidate = id;
    while (seen.has(candidate)) {
      candidate = `${id}-${n++}`;
    }
    id = candidate;
    seen.add(id);
    entries.push({ id, text });
  }

  return entries;
}
