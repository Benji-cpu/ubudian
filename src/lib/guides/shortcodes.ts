import type { GuideShortcodeKind } from "@/types";

export type ShortcodeModifier = "card" | null;

export interface ShortcodeNode {
  type: "shortcode";
  kind: GuideShortcodeKind;
  slug: string;
  modifier: ShortcodeModifier;
}

export interface TextNode {
  type: "text";
  value: string;
}

export type ParsedNode = ShortcodeNode | TextNode;

export interface ShortcodeRef {
  kind: GuideShortcodeKind;
  slug: string;
}

const KINDS: readonly GuideShortcodeKind[] = [
  "event",
  "practitioner",
  "place",
  "partner",
  "story",
  "retreat",
];

const SHORTCODE_RE =
  /\{\{(event|practitioner|place|partner|story|retreat):([a-z0-9][a-z0-9-]*)(?:\|(card))?\}\}/g;

export function parseShortcodes(input: string): ParsedNode[] {
  if (!input) return [];

  const nodes: ParsedNode[] = [];
  let cursor = 0;

  for (const match of input.matchAll(SHORTCODE_RE)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const kind = match[1] as GuideShortcodeKind;
    const slug = match[2];
    const modifier = (match[3] ?? null) as ShortcodeModifier;

    if (!KINDS.includes(kind)) continue;

    if (start > cursor) {
      nodes.push({ type: "text", value: input.slice(cursor, start) });
    }

    nodes.push({ type: "shortcode", kind, slug, modifier });
    cursor = end;
  }

  if (cursor < input.length) {
    nodes.push({ type: "text", value: input.slice(cursor) });
  }

  if (nodes.length === 0) {
    return [{ type: "text", value: input }];
  }

  return nodes;
}

export function collectShortcodeRefs(nodes: ParsedNode[]): ShortcodeRef[] {
  const seen = new Set<string>();
  const refs: ShortcodeRef[] = [];
  for (const node of nodes) {
    if (node.type !== "shortcode") continue;
    const key = `${node.kind}:${node.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ kind: node.kind, slug: node.slug });
  }
  return refs;
}

export interface ResolvedEntity {
  kind: GuideShortcodeKind;
  slug: string;
  title: string;
  subtitle?: string | null;
  href: string;
  imageUrl?: string | null;
}

export type ShortcodeResolverDeps = {
  resolveEvent?: (slug: string) => Promise<ResolvedEntity | null>;
  resolveStory?: (slug: string) => Promise<ResolvedEntity | null>;
  resolveRetreat?: (slug: string) => Promise<ResolvedEntity | null>;
  resolvePractitioner?: (slug: string) => Promise<ResolvedEntity | null>;
  resolvePlace?: (slug: string) => Promise<ResolvedEntity | null>;
  resolvePartner?: (slug: string) => Promise<ResolvedEntity | null>;
};

export type ResolvedRefs = Map<string, ResolvedEntity | null>;

const KEY = (kind: GuideShortcodeKind, slug: string) => `${kind}:${slug}`;

export async function resolveShortcodes(
  refs: ShortcodeRef[],
  deps: ShortcodeResolverDeps,
): Promise<ResolvedRefs> {
  const resolved: ResolvedRefs = new Map();

  await Promise.all(
    refs.map(async ({ kind, slug }) => {
      const fn =
        kind === "event" ? deps.resolveEvent
        : kind === "story" ? deps.resolveStory
        : kind === "retreat" ? deps.resolveRetreat
        : kind === "practitioner" ? deps.resolvePractitioner
        : kind === "place" ? deps.resolvePlace
        : kind === "partner" ? deps.resolvePartner
        : null;
      const entity = fn ? await fn(slug) : null;
      resolved.set(KEY(kind, slug), entity);
    }),
  );

  return resolved;
}

export function lookupResolved(
  resolved: ResolvedRefs,
  kind: GuideShortcodeKind,
  slug: string,
): ResolvedEntity | null {
  return resolved.get(KEY(kind, slug)) ?? null;
}
