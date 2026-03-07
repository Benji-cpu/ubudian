import { StoryForm } from "@/components/admin/story-form";

export default function NewStoryPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Story</h1>
      <p className="mt-1 text-muted-foreground">
        Create a new Humans of Ubud story.
      </p>
      <div className="mt-8">
        <StoryForm />
      </div>
    </div>
  );
}
