import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartnerForm } from "@/components/admin/partner-form";
import type { Partner } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPartnerPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("partners").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const partner = data as Partner;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Partner</h1>
        <p className="mt-1 text-sm text-muted-foreground">{partner.name}</p>
      </div>
      <PartnerForm initialData={partner} />
    </div>
  );
}
