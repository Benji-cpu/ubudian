import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVenueByToken } from "@/lib/specials/reconfirm";
import { ReconfirmForm } from "@/components/specials/reconfirm-form";

export const metadata: Metadata = {
  title: "Keep your deal listed — The Ubudian",
  robots: { index: false, follow: false },
};

export default async function ConfirmSpecialsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const venue = await getVenueByToken(token);
  if (!venue) notFound();

  return (
    <div>
      <section className="bg-brand-cream px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta">Ubud deals</p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-brand-deep-green sm:text-4xl">
            Still running at {venue.venueName}?
          </h1>
          <p className="mt-4 text-muted-foreground">
            One tap keeps your listing up for another month. Untick anything that has stopped.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <ReconfirmForm token={token} specials={venue.specials} />
      </section>
    </div>
  );
}
