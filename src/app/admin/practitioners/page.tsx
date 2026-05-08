import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff } from "lucide-react";
import type { Practitioner } from "@/types";

export default async function AdminPractitionersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("*")
    .order("name", { ascending: true });
  const practitioners = (data ?? []) as Practitioner[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Practitioners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sound healers, breathwork guides, bodyworkers, and the people who hold pieces of a retreat.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/practitioners/new">
            <Plus className="mr-2 h-4 w-4" />
            New Practitioner
          </Link>
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Practitioner</th>
              <th className="px-4 py-2 font-medium">Modalities</th>
              <th className="px-4 py-2 font-medium">Base</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {practitioners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No practitioners yet. Create the first one.
                </td>
              </tr>
            ) : (
              practitioners.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.photo_url ? (
                        <Image
                          src={p.photo_url}
                          alt={p.name}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full border border-brand-gold/20 object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-deep-green text-xs font-medium text-brand-gold">
                          {p.name
                            .split(/\s+/)
                            .map((s) => s[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                      )}
                      <div>
                        <Link
                          href={`/admin/practitioners/${p.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        {p.contact_instagram && (
                          <div className="text-xs text-muted-foreground">
                            @{p.contact_instagram}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.modalities.slice(0, 3).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.base_location ?? "—"}
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
                      <Link href={`/admin/practitioners/${p.id}/edit`}>Edit</Link>
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
