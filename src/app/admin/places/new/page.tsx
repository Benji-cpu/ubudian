import { PlaceForm } from "@/components/admin/place-form";

export default function NewPlacePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Place</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A temple, studio, café, retreat centre — anything that gets referenced inside a guide or
          journey. Draft until ready; publish to make it linkable.
        </p>
      </div>
      <PlaceForm />
    </div>
  );
}
