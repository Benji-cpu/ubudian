import { GuideForm } from "@/components/admin/guide-form";

export default function NewGuidePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">New Guide</h1>
      <p className="mt-1 text-muted-foreground">
        Pick a tier — practical for Survival Guide content, intent for the Why You Came playbooks.
      </p>
      <div className="mt-8">
        <GuideForm />
      </div>
    </div>
  );
}
