import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Sponsor } from "@/types";

const TIER_LABEL: Record<Sponsor["tier"], string> = {
  anchor: "Anchor",
  partner: "Partner",
  patron: "Patron",
};

export default async function AdminSponsorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .order("status", { ascending: true })
    .order("tier", { ascending: true })
    .order("name", { ascending: true });
  const sponsors = (data ?? []) as Sponsor[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community Partners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aligned local businesses paying to be featured. Sponsorship placements attach individual
            events, journeys, or newsletter editions to a partner — manage those from the entity edit
            page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/sponsors/leads">Leads</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/sponsors/new">
              <Plus className="mr-2 h-4 w-4" />
              New Partner
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Partner</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Monthly</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sponsors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No partners yet. Add the first one.
                </td>
              </tr>
            ) : (
              sponsors.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sponsors/${s.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {s.name}
                    </Link>
                    {s.tagline && (
                      <div className="text-xs text-muted-foreground">{s.tagline}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{TIER_LABEL[s.tier]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.category_sponsor ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.monthly_amount_cents != null
                      ? `$${(s.monthly_amount_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "active" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <Eye className="h-3 w-3" /> Active
                      </span>
                    ) : s.status === "paused" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                        <Pause className="h-3 w-3" /> Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Ended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/sponsors/${s.id}/edit`}>Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
