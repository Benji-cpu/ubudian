import { SponsorForm } from "@/components/admin/sponsor-form";
import type { SponsorTier } from "@/types";

interface PageProps {
  searchParams: Promise<{
    name?: string;
    email?: string;
    tier?: string;
    from_lead?: string;
  }>;
}

const TIERS: SponsorTier[] = ["patron", "partner", "anchor"];

export default async function NewSponsorPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const preset = {
    name: sp.name ?? "",
    contact_email: sp.email ?? "",
    tier: TIERS.includes(sp.tier as SponsorTier) ? (sp.tier as SponsorTier) : undefined,
    from_lead_id: sp.from_lead,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Community Partner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aligned local business paying to be featured — yoga studio, ceremony space, tantra
          facilitator, boutique villa, farm-to-table restaurant. Holds a public partner profile and
          can be attached to events, editions, journeys, and stories.
        </p>
      </div>
      <SponsorForm preset={preset} />
    </div>
  );
}
