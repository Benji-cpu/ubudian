import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExperienceForm } from "@/components/admin/experience-form";
import type { Experience } from "@/types";

interface EditExperiencePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: experience } = await supabase
    .from("experiences")
    .select("*")
    .eq("id", id)
    .single();

  if (!experience) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Experience</h1>
      <p className="mt-1 text-muted-foreground">
        Update this experience.
      </p>
      <div className="mt-8">
        <ExperienceForm initialData={experience as Experience} />
      </div>
    </div>
  );
}
