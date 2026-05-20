import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff } from "lucide-react";
import type { Place } from "@/types";

const KIND_LABELS: Record<string, string> = {
  temple: "Temple",
  venue: "Venue",
  cafe: "Café",
  restaurant: "Restaurant",
  studio: "Studio",
  spa: "Spa",
  retreat_centre: "Retreat centre",
  natural: "Natural",
  market: "Market",
  other: "Other",
};

export default async function AdminPlacesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("places")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const places = (data ?? []) as Place[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Places</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Temples, studios, cafés, retreat centres — the venues guides and journeys lean on.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/places/new">
            <Plus className="mr-2 h-4 w-4" />
            New Place
          </Link>
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Place</th>
              <th className="px-4 py-2 font-medium">Kind</th>
              <th className="px-4 py-2 font-medium">Neighbourhood</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {places.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No places yet. Create the first one.
                </td>
              </tr>
            ) : (
              places.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.hero_image_url ? (
                        <Image
                          src={p.hero_image_url}
                          alt={p.name}
                          width={48}
                          height={36}
                          className="h-9 w-12 rounded border border-brand-gold/20 object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-12 items-center justify-center rounded bg-brand-deep-green text-xs font-medium text-brand-gold">
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <Link
                          href={`/admin/places/${p.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        {p.short_description && (
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {p.short_description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {KIND_LABELS[p.kind] ?? p.kind}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.neighbourhood ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_published ? (
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
                      <Link href={`/admin/places/${p.id}/edit`}>Edit</Link>
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
