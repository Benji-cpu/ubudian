import { JourneyForm } from "@/components/admin/journey-form";

export default function NewJourneyPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Journey</h1>
      <p className="mt-1 text-muted-foreground">
        Create a new curated journey. Days and slots are added after the journey
        is saved.
      </p>
      <div className="mt-8">
        <JourneyForm />
      </div>
    </div>
  );
}
