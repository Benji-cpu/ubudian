import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PractitionerForm } from "@/components/admin/practitioner-form";
import type { Practitioner } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPractitionerPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const practitioner = data as Practitioner;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Practitioner</h1>
        <p className="mt-1 text-sm text-muted-foreground">{practitioner.name}</p>
      </div>
      <PractitionerForm initialData={practitioner} />
    </div>
  );
}
