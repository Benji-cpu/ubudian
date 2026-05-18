import { SponsorForm } from "@/components/admin/sponsor-form";

export default function NewSponsorPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Community Partner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aligned local business paying to be featured — yoga studio, ceremony space, tantra
          facilitator, boutique villa, farm-to-table restaurant. Holds a public partner profile and
          can be attached to events, editions, journeys, and stories.
        </p>
      </div>
      <SponsorForm />
    </div>
  );
}
