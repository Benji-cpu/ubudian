import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { queryWithRetry } from "@/lib/supabase/retry";
import {
  getGuideBySlug,
  getGuidesByRelatedSlugs,
} from "@/lib/guides/queries";
import {
  parseShortcodes,
  collectShortcodeRefs,
  resolveShortcodes,
} from "@/lib/guides/shortcodes";
import { defaultGuideResolvers } from "@/lib/guides/resolvers";
import { PracticalGuide } from "@/components/guides/practical-guide";
import { IntentGuide } from "@/components/guides/intent-guide";
import type { Journey } from "@/types";

interface GuideDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) {
    return { title: "Guide | The Ubudian" };
  }
  return {
    title: `${guide.title} | The Ubudian Guides`,
    description: guide.subtitle ?? undefined,
    openGraph: guide.hero_image_url
      ? { images: [{ url: guide.hero_image_url }] }
      : undefined,
  };
}

async function getLinkedRetreat(id: string | null): Promise<Journey | null> {
  if (!id) return null;
  try {
    const supabase = await createClient();
    const { data } = await queryWithRetry(
      () =>
        supabase
          .from("journeys")
          .select("*")
          .eq("id", id)
          .eq("is_published", true)
          .limit(1)
          .maybeSingle(),
      "guide-linked-retreat",
    );
    return (data as Journey | null) ?? null;
  } catch {
    return null;
  }
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  // Parse shortcodes, collect refs, resolve in parallel with related-guide fetches.
  const nodes = parseShortcodes(guide.body_md);
  const refs = collectShortcodeRefs(nodes);

  const [resolved, linkedRetreat, relatedGuides] = await Promise.all([
    resolveShortcodes(refs, defaultGuideResolvers),
    getLinkedRetreat(guide.linked_retreat_id),
    getGuidesByRelatedSlugs(guide.related_guide_slugs),
  ]);

  if (guide.tier === "practical") {
    return <PracticalGuide guide={guide} resolved={resolved} />;
  }
  return (
    <IntentGuide
      guide={guide}
      resolved={resolved}
      linkedRetreat={linkedRetreat}
      relatedGuides={relatedGuides}
    />
  );
}
