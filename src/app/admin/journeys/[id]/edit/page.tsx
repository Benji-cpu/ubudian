import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JourneyForm } from "@/components/admin/journey-form";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { Journey } from "@/types";

interface EditJourneyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJourneyPage({ params }: EditJourneyPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const journey = data as Journey;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Journey</h1>
          <p className="mt-1 text-muted-foreground">{journey.title}</p>
        </div>
        {journey.is_published && (
          <Button asChild variant="outline">
            <Link href={`/experiences/${journey.slug}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View live
            </Link>
          </Button>
        )}
      </div>
      <div className="mt-8">
        <JourneyForm initialData={journey} />
      </div>
    </div>
  );
}
