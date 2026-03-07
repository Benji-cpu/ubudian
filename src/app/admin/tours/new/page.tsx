import { TourForm } from "@/components/admin/tour-form";

export default function NewTourPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Tour</h1>
      <p className="mt-1 text-muted-foreground">
        Create a new Ubudian Secret Tour.
      </p>
      <div className="mt-8">
        <TourForm />
      </div>
    </div>
  );
}
