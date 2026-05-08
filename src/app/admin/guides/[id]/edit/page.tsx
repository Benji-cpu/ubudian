import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuideForm } from "@/components/admin/guide-form";
import type { Guide } from "@/types";

interface EditGuidePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGuidePage({ params }: EditGuidePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("guides")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const guide = (data as Guide | null) ?? null;
  if (!guide) notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Guide</h1>
      <p className="mt-1 text-muted-foreground">{guide.title}</p>
      <div className="mt-8">
        <GuideForm initialData={guide} />
      </div>
    </div>
  );
}
