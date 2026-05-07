import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Journey } from "@/types";

export default async function AdminJourneysPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journeys")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  const journeys = (data ?? []) as Journey[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Journeys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Time-bounded curated paths through Ubud&apos;s scene. The user-facing
            label is &ldquo;Experiences&rdquo;.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/journeys/new">
            <Plus className="mr-2 h-4 w-4" />
            New Journey
          </Link>
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium">Length</th>
              <th className="px-4 py-2 font-medium">Sort</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {journeys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No journeys yet. Create the first one.
                </td>
              </tr>
            ) : (
              journeys.map((j) => (
                <tr key={j.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/journeys/${j.id}/edit`} className="font-medium hover:underline">
                      {j.title}
                    </Link>
                    {j.subtitle && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{j.subtitle}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {j.tier.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{j.length_days}d</td>
                  <td className="px-4 py-3">{j.sort_order}</td>
                  <td className="px-4 py-3">
                    {j.is_published ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <Eye className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/journeys/${j.id}/edit`}>Edit</Link>
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
