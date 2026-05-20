import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlaceForm } from "@/components/admin/place-form";
import type { Place } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlacePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const place = data as Place;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Place</h1>
        <p className="mt-1 text-sm text-muted-foreground">{place.name}</p>
      </div>
      <PlaceForm initialData={place} />
    </div>
  );
}
