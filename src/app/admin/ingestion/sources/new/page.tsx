import { SourceForm } from "@/components/admin/ingestion/source-form";

export default function NewSourcePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add Event Source</h1>
      <div className="max-w-2xl">
        <SourceForm />
      </div>
    </div>
  );
}
