import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SourceForm } from "@/components/admin/ingestion/source-form";
import type { EventSource } from "@/types";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("event_sources")
    .select("*")
    .eq("id", id)
    .single();

  if (!source) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Source</h1>
      <div className="max-w-2xl">
        <SourceForm source={source as EventSource} />
      </div>
    </div>
  );
}
