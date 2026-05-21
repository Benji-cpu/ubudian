import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { PractitionerCard } from "@/components/practitioners/practitioner-card";
import type { Practitioner } from "@/types";

export const metadata: Metadata = {
  title: "Practitioners",
  description:
    "The healers, bodyworkers, sound carriers and quiet teachers we've sat with — the people behind the practice in Ubud.",
};

interface PageProps {
  searchParams: Promise<{ modality?: string }>;
}

async function getActivePractitioners(): Promise<Practitioner[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practitioners")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    return (data as Practitioner[] | null) ?? [];
  } catch {
    return [];
  }
}

export default async function PractitionersPage({ searchParams }: PageProps) {
  const { modality } = await searchParams;
  const all = await getActivePractitioners();

  const modalities = Array.from(
    new Set(all.flatMap((p) => p.modalities)),
  ).sort();

  const visible = modality
    ? all.filter((p) =>
        p.modalities.some(
          (m) => m.toLowerCase() === modality.toLowerCase(),
        ),
      )
    : all;

  return (
    <>
      <PageHero
        variant="cream"
        kicker="The People"
        title="Practitioners"
        subtitle="Healers, bodyworkers, breathwork guides — the quiet carriers of practice in Ubud."
      />

      {modalities.length > 0 && (
        <section className="border-b border-brand-gold/15 bg-brand-cream/60">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/practitioners"
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] transition-colors ${
                !modality
                  ? "border-brand-deep-green bg-brand-deep-green text-brand-cream"
                  : "border-brand-gold/30 text-brand-charcoal-light hover:border-brand-deep-green hover:text-brand-deep-green"
              }`}
            >
              All
            </Link>
            {modalities.map((m) => {
              const active = modality?.toLowerCase() === m.toLowerCase();
              return (
                <Link
                  key={m}
                  href={`/practitioners?modality=${encodeURIComponent(m)}`}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? "border-brand-deep-green bg-brand-deep-green text-brand-cream"
                      : "border-brand-gold/30 text-brand-charcoal-light hover:border-brand-deep-green hover:text-brand-deep-green"
                  }`}
                >
                  {m}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-brand-cream py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {visible.length === 0 ? (
            <p className="py-16 text-center text-sm italic text-brand-charcoal-light">
              No practitioners match that filter yet.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <li key={p.id}>
                  <PractitionerCard practitioner={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
