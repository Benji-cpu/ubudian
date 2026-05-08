import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { GuideCard } from "@/components/guides/guide-card";
import { Button } from "@/components/ui/button";
import type { Guide } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Guides",
};

export default async function DashboardGuidesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_guides")
    .select("guide_id, created_at, guides(*)")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  const saved = (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.guides as Guide)
    .filter((g): g is Guide => Boolean(g) && g.status === "published");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-brand-deep-green">
          My Guides
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reading you&apos;ve saved — Survival Guide essentials and the Why You Came playbooks.
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-md border border-dashed py-16 text-center">
          <p className="text-base text-muted-foreground">
            You haven&apos;t saved any guides yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/guides">Browse guides</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((g) => (
            <GuideCard
              key={g.id}
              guide={g}
              variant={g.tier === "intent" ? "intent-medium" : "practical"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
