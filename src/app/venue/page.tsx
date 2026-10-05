import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedVenues, getVenueByConfirmToken, listVenueDeals, REVIEW_PROMISE } from "@/lib/venue";
import { VenueDeals } from "@/components/venue/venue-deals";
import { ClaimButton } from "@/components/venue/claim-button";
import { NewVenueForm } from "@/components/venue/new-venue-form";

export const metadata: Metadata = {
  title: "My venue — Ubud deals",
  description: "Add and edit your venue's deals on The Ubudian. Free.",
  robots: { index: false, follow: false },
};

function Shell({ children, intro }: { children: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta">Ubud deals</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">My venue</h1>
      <p className="mt-3 text-muted-foreground">
        {intro ?? "Add and edit your deals. Free, now and later."} {REVIEW_PROMISE}.
      </p>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

export default async function VenuePage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const { claim } = await searchParams;
  const user = await getCurrentUser();
  const signIn = `/login?redirect=${encodeURIComponent(claim ? `/venue?claim=${claim}` : "/venue")}`;

  if (claim) {
    const venue = await getVenueByConfirmToken(claim);
    if (!venue) {
      return (
        <Shell>
          <p className="rounded-xl border p-5 text-muted-foreground">
            This link isn&apos;t valid any more. If you run a venue, sign in below and add it.
          </p>
          <Button asChild><Link href="/venue">Go to My venue</Link></Button>
        </Shell>
      );
    }
    if (!user) {
      return (
        <Shell intro={`Manage ${venue.name}'s deals on The Ubudian: free, now and later.`}>
          <p className="text-muted-foreground">Sign in with Google first. It takes a few seconds and nothing is posted anywhere.</p>
          <Button asChild size="lg"><Link href={signIn}>Sign in with Google</Link></Button>
        </Shell>
      );
    }
    if (venue.owner_user_id !== user.id) {
      return (
        <Shell intro={`Manage ${venue.name}'s deals on The Ubudian: free, now and later.`}>
          <ClaimButton token={claim} venueName={venue.name} />
        </Shell>
      );
    }
  }

  if (!user) {
    return (
      <Shell>
        <p className="text-muted-foreground">
          Run a restaurant, café or bar in Ubud? Sign in with Google to list your deals. If we emailed you a link, open
          that link instead: it connects you to your venue.
        </p>
        <Button asChild size="lg"><Link href={signIn}>Sign in with Google</Link></Button>
      </Shell>
    );
  }

  const venues = await getOwnedVenues(user.id);
  if (venues.length === 0) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Add your venue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Already listed on The Ubudian? Open the link in our email instead, and it connects you to your venue.
          </p>
          <div className="mt-5"><NewVenueForm /></div>
        </div>
      </Shell>
    );
  }

  const withDeals = await Promise.all(venues.map(async (v) => ({ venue: v, deals: await listVenueDeals(v.id) })));
  return (
    <Shell>
      {withDeals.map(({ venue, deals }) => (
        <VenueDeals key={venue.id} venue={venue} deals={deals} />
      ))}
    </Shell>
  );
}
