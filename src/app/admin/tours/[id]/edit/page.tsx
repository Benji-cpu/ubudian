import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TourForm } from "@/components/admin/tour-form";
import type { Tour } from "@/types";

interface EditTourPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTourPage({ params }: EditTourPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tour } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .single();

  if (!tour) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Tour</h1>
      <p className="mt-1 text-muted-foreground">
        Update this tour.
      </p>
      <div className="mt-8">
        <TourForm initialData={tour as Tour} />
      </div>
    </div>
  );
}
