import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Sponsor,
  Sponsorship,
  SponsorshipEntityType,
  SponsorshipWithSponsor,
} from "@/types";

/**
 * Whether a sponsorship row covers the given timestamp.
 * Active = sponsor active AND now >= starts_at AND (ends_at IS NULL OR now < ends_at).
 * The sponsor.status filter is applied in SQL via the join when possible; this
 * helper exists for unit tests that pass raw rows.
 */
export function isSponsorshipActive(
  row: Pick<Sponsorship, "starts_at" | "ends_at">,
  now: Date = new Date()
): boolean {
  const startsMs = new Date(row.starts_at).getTime();
  if (Number.isNaN(startsMs) || startsMs > now.getTime()) return false;
  if (!row.ends_at) return true;
  const endsMs = new Date(row.ends_at).getTime();
  if (Number.isNaN(endsMs)) return true;
  return endsMs > now.getTime();
}

export const listActiveSponsors = cache(async (): Promise<Sponsor[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("status", "active")
    .order("tier", { ascending: false }) // anchor > partner > patron, but text sort is fine for stable order
    .order("name", { ascending: true });

  if (error) {
    console.error("[sponsor-service] listActiveSponsors error:", error);
    return [];
  }
  return ((data ?? []) as Sponsor[]).sort(byTierThenName);
});

export async function getSponsorBySlug(slug: string): Promise<Sponsor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[sponsor-service] getSponsorBySlug error:", error);
    return null;
  }
  return (data as Sponsor | null) ?? null;
}

/**
 * Returns the active sponsorship for an entity, if any, with the sponsor joined in.
 * "Active" = sponsor.status='active', sponsorship.starts_at <= now,
 * and (sponsorship.ends_at IS NULL OR sponsorship.ends_at > now).
 *
 * If multiple match (data anomaly — we enforce one per entity at the application
 * layer, not via constraint), the most recently started one wins.
 */
export async function getActiveSponsorshipFor(
  entityType: SponsorshipEntityType,
  entityId: string
): Promise<SponsorshipWithSponsor | null> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("sponsorships")
    .select("*, sponsor:sponsors!inner(*)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .lte("starts_at", nowIso)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .eq("sponsor.status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[sponsor-service] getActiveSponsorshipFor error:", error);
    return null;
  }
  if (!data) return null;
  return data as unknown as SponsorshipWithSponsor;
}

/**
 * Set of event IDs currently boosted via an active Partner- or Anchor-tier
 * sponsorship. Patron-tier sponsorships do not boost — those are directory-only.
 * The caller decides what to do with the set (sort priority, badge, etc.).
 *
 * Returned as a Set for O(1) membership checks in ranking + bucket comparators.
 */
export const getActiveBoostedEventIds = cache(async (): Promise<Set<string>> => {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("sponsorships")
    .select("entity_id, sponsor:sponsors!inner(tier, status)")
    .eq("entity_type", "event")
    .lte("starts_at", nowIso)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .eq("sponsor.status", "active")
    .in("sponsor.tier", ["partner", "anchor"]);

  if (error) {
    console.error("[sponsor-service] getActiveBoostedEventIds error:", error);
    return new Set();
  }

  const rows = (data ?? []) as { entity_id: string }[];
  return new Set(rows.map((r) => r.entity_id));
});

/**
 * Map of `partners.id → sponsor slug` for anchor-tier sponsors. Used to mark
 * journey atoms whose underlying partner is also a community partner — we
 * match by slug since `partners` and `sponsors` are independent tables today
 * (the two are linked by sharing a slug). Empty map if there are no overlaps.
 */
export const getAnchorPartnerSlugsByPartnerId = cache(async (): Promise<Map<string, string>> => {
  const supabase = await createClient();

  const [partnersRes, sponsorsRes] = await Promise.all([
    supabase.from("partners").select("id, slug").eq("is_active", true),
    supabase.from("sponsors").select("slug, tier, status").eq("status", "active").eq("tier", "anchor"),
  ]);

  if (partnersRes.error) {
    console.error("[sponsor-service] anchor partners: partners query error:", partnersRes.error);
    return new Map();
  }
  if (sponsorsRes.error) {
    console.error("[sponsor-service] anchor partners: sponsors query error:", sponsorsRes.error);
    return new Map();
  }

  const anchorSlugs = new Set(((sponsorsRes.data ?? []) as { slug: string }[]).map((s) => s.slug));
  const out = new Map<string, string>();
  for (const p of ((partnersRes.data ?? []) as { id: string; slug: string }[])) {
    if (anchorSlugs.has(p.slug)) out.set(p.id, p.slug);
  }
  return out;
});

/**
 * Anchor-tier sponsor that owns the given event category (e.g. "Dance & Movement").
 * One active sponsor per category is enforced by a unique partial index in SQL.
 */
export async function getCategorySponsor(category: string): Promise<Sponsor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("status", "active")
    .eq("category_sponsor", category)
    .maybeSingle();

  if (error) {
    console.error("[sponsor-service] getCategorySponsor error:", error);
    return null;
  }
  return (data as Sponsor | null) ?? null;
}

const TIER_RANK: Record<Sponsor["tier"], number> = {
  anchor: 0,
  partner: 1,
  patron: 2,
};

function byTierThenName(a: Sponsor, b: Sponsor): number {
  const t = TIER_RANK[a.tier] - TIER_RANK[b.tier];
  if (t !== 0) return t;
  return a.name.localeCompare(b.name);
}
