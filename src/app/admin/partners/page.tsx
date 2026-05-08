import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Partner } from "@/types";

export default async function AdminPartnersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partners")
    .select("*")
    .order("kind", { ascending: true })
    .order("name", { ascending: true });
  const partners = (data ?? []) as Partner[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Villas, hotels, restaurants, studios, and spas — businesses with affiliate arrangements
            that show up inside retreats.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/partners/new">
            <Plus className="mr-2 h-4 w-4" />
            New Partner
          </Link>
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Partner</th>
              <th className="px-4 py-2 font-medium">Kind</th>
              <th className="px-4 py-2 font-medium">Affiliate</th>
              <th className="px-4 py-2 font-medium">Commission</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No partners yet. Add the first villa, restaurant, or studio.
                </td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/partners/${p.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.base_location && (
                      <div className="text-xs text-muted-foreground">{p.base_location}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {p.kind}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.affiliate_url ? (
                      <a
                        href={p.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-gold hover:underline"
                      >
                        Set <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.commission_rate ? `${p.commission_rate}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <Eye className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/partners/${p.id}/edit`}>Edit</Link>
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
