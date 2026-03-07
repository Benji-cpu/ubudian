import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryForm } from "@/components/admin/story-form";
import type { Story } from "@/types";

interface EditStoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStoryPage({ params }: EditStoryPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (!story) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Story</h1>
      <p className="mt-1 text-muted-foreground">
        Update this Humans of Ubud story.
      </p>
      <div className="mt-8">
        <StoryForm initialData={story as Story} />
      </div>
    </div>
  );
}
