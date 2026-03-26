import { ExperienceForm } from "@/components/admin/experience-form";

export default function NewExperiencePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Experience</h1>
      <p className="mt-1 text-muted-foreground">
        Create a new curated experience.
      </p>
      <div className="mt-8">
        <ExperienceForm />
      </div>
    </div>
  );
}
