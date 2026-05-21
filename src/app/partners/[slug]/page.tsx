import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartnerDetail } from "@/components/partners/partner-detail";
import { MentionedInGuides } from "@/components/cross-links/mentioned-in-guides";
import type { Partner } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPartner(slug: string): Promise<Partner | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    return (data as Partner | null) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const partner = await getPartner(slug);
  if (!partner) return { title: "Partner" };
  return {
    title: `${partner.name}`,
    description:
      partner.short_description ??
      partner.description?.slice(0, 160) ??
      undefined,
  };
}

export default async function PartnerPage({ params }: PageProps) {
  const { slug } = await params;
  const partner = await getPartner(slug);
  if (!partner) notFound();

  return (
    <>
      <PartnerDetail partner={partner} />
      <MentionedInGuides refKind="partner" refSlug={partner.slug} />
    </>
  );
}
