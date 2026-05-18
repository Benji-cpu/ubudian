import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SponsorForm } from "@/components/admin/sponsor-form";
import { SponsorAnalyticsCard } from "@/components/admin/sponsor-analytics-card";
import type { Sponsor } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSponsorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("sponsors").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const sponsor = data as Sponsor;

  // Rolling 30-day analytics aggregate — cheap enough to fetch alongside the edit form.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events30 } = await supabase
    .from("sponsorship_events")
    .select("event_type")
    .eq("sponsor_id", sponsor.id)
    .gte("created_at", thirtyDaysAgo);
  const counts = (events30 ?? []).reduce(
    (acc, row) => {
      const t = (row as { event_type: string }).event_type;
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Community Partner</h1>
          <p className="mt-1 text-sm text-muted-foreground">{sponsor.name}</p>
        </div>
      </div>

      <SponsorAnalyticsCard
        impressions={counts.event_impression ?? 0}
        profileViews={counts.profile_view ?? 0}
        clicks={counts.partner_click ?? 0}
        sponsor={sponsor}
      />

      <div className="mt-8">
        <SponsorForm initialData={sponsor} />
      </div>
    </div>
  );
}
