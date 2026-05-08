import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { JourneyCard } from "@/components/journeys/journey-card";
import { Button } from "@/components/ui/button";
import type { Journey } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Retreats",
};

export default async function DashboardRetreatsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_journeys")
    .select("journey_id, created_at, journeys(*)")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  const saved = (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.journeys as Journey)
    .filter(Boolean) as Journey[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-brand-deep-green">
          My Retreats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated paths you&apos;ve saved. Tap into a retreat to walk it again.
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-md border border-dashed py-16 text-center">
          <p className="text-base text-muted-foreground">
            You haven&apos;t saved any retreats yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/experiences">Browse retreats</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {saved.map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
      )}
    </div>
  );
}
