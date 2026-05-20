import { createClient } from "@/lib/supabase/server";
import { renderAtomOg, ogSize, ogContentType } from "@/lib/og/atom-card";

export const alt = "Ubudian Partner";
export const size = ogSize;
export const contentType = ogContentType;

const KIND_LABELS: Record<string, string> = {
  villa: "Villa",
  hotel: "Hotel",
  homestay: "Homestay",
  restaurant: "Restaurant",
  cafe: "Café",
  studio: "Studio",
  spa: "Spa",
  other: "Partner",
};

export default async function PartnerOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("partners")
    .select("name, kind, short_description, description, hero_image_url, base_location")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const row = (data as null | {
    name: string;
    kind: string;
    short_description: string | null;
    description: string | null;
    hero_image_url: string | null;
    base_location: string | null;
  }) ?? null;

  if (!row) {
    return renderAtomOg({ kindLabel: "Partner", title: "The Ubudian" });
  }

  return renderAtomOg({
    kindLabel: KIND_LABELS[row.kind] ?? "Partner",
    title: row.name,
    subtitle: row.short_description ?? row.description?.slice(0, 140) ?? null,
    cover: row.hero_image_url ?? null,
    tags: row.base_location ? [row.base_location] : [],
  });
}
