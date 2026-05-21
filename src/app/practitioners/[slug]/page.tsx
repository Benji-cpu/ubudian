import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PractitionerDetail } from "@/components/practitioners/practitioner-detail";
import { PractitionerCard } from "@/components/practitioners/practitioner-card";
import { MentionedInGuides } from "@/components/cross-links/mentioned-in-guides";
import type { Practitioner } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPractitioner(slug: string): Promise<Practitioner | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practitioners")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    return (data as Practitioner | null) ?? null;
  } catch {
    return null;
  }
}

async function getRelatedPractitioners(
  current: Practitioner,
  limit = 3,
): Promise<Practitioner[]> {
  if (current.modalities.length === 0) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practitioners")
      .select("*")
      .eq("is_active", true)
      .neq("id", current.id)
      .overlaps("modalities", current.modalities)
      .limit(limit);
    return ((data as Practitioner[] | null) ?? []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const practitioner = await getPractitioner(slug);
  if (!practitioner) return { title: "Practitioner" };
  return {
    title: `${practitioner.name}`,
    description:
      practitioner.short_description ??
      practitioner.bio?.slice(0, 160) ??
      undefined,
  };
}

export default async function PractitionerPage({ params }: PageProps) {
  const { slug } = await params;
  const practitioner = await getPractitioner(slug);
  if (!practitioner) notFound();

  const related = await getRelatedPractitioners(practitioner);

  return (
    <>
      <PractitionerDetail practitioner={practitioner} />

      <MentionedInGuides refKind="practitioner" refSlug={practitioner.slug} />

      {related.length > 0 && (
        <section className="bg-brand-cream/40 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              Practitioners working in adjacent space
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
              You might also sit with
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <PractitionerCard practitioner={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
