import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SponsorForm } from "@/components/admin/sponsor-form";
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Community Partner</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sponsor.name}</p>
      </div>
      <SponsorForm initialData={sponsor} />
    </div>
  );
}
