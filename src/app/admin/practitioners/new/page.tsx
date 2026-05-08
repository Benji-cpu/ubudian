import { PractitionerForm } from "@/components/admin/practitioner-form";

export default function NewPractitionerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Practitioner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a sound healer, bodyworker, breathwork guide, or anyone whose work shows up inside a retreat.
        </p>
      </div>
      <PractitionerForm />
    </div>
  );
}
