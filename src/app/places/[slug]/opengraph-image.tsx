import { createClient } from "@/lib/supabase/server";
import { renderAtomOg, ogSize, ogContentType } from "@/lib/og/atom-card";

export const alt = "Ubudian Place";
export const size = ogSize;
export const contentType = ogContentType;

const KIND_LABELS: Record<string, string> = {
  temple: "Temple",
  venue: "Venue",
  cafe: "Café",
  restaurant: "Restaurant",
  studio: "Studio",
  spa: "Spa",
  retreat_centre: "Retreat centre",
  natural: "Natural",
  market: "Market",
  other: "Place",
};

export default async function PlaceOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("places")
    .select("name, kind, short_description, description, hero_image_url, photo_urls, theme_tags")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  const row = (data as null | {
    name: string;
    kind: string;
    short_description: string | null;
    description: string | null;
    hero_image_url: string | null;
    photo_urls: string[] | null;
    theme_tags: string[] | null;
  }) ?? null;

  if (!row) {
    return renderAtomOg({ kindLabel: "Place", title: "The Ubudian" });
  }

  return renderAtomOg({
    kindLabel: KIND_LABELS[row.kind] ?? "Place",
    title: row.name,
    subtitle: row.short_description ?? row.description?.slice(0, 140) ?? null,
    cover: row.hero_image_url ?? row.photo_urls?.[0] ?? null,
    tags: row.theme_tags ?? [],
  });
}
