import { createClient } from "@/lib/supabase/server";
import { renderAtomOg, ogSize, ogContentType } from "@/lib/og/atom-card";

export const alt = "Ubudian Practitioner";
export const size = ogSize;
export const contentType = ogContentType;

export default async function PractitionerOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("name, short_description, bio, hero_image_url, photo_url, modalities")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const row = (data as null | {
    name: string;
    short_description: string | null;
    bio: string | null;
    hero_image_url: string | null;
    photo_url: string | null;
    modalities: string[] | null;
  }) ?? null;

  if (!row) {
    return renderAtomOg({
      kindLabel: "Practitioner",
      title: "The Ubudian",
    });
  }

  return renderAtomOg({
    kindLabel: "Practitioner",
    title: row.name,
    subtitle: row.short_description ?? row.bio?.slice(0, 140) ?? null,
    cover: row.hero_image_url ?? row.photo_url ?? null,
    tags: row.modalities ?? [],
  });
}
