import { PartnerForm } from "@/components/admin/partner-form";

export default function NewPartnerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Partner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Villas, hotels, restaurants, studios, and spas — anything you have or want an affiliate
          arrangement with.
        </p>
      </div>
      <PartnerForm />
    </div>
  );
}
