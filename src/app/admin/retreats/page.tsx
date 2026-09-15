import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Users, Building, Map } from "lucide-react";

/**
 * Hub for the retreat product and its directory. Tours were retired on
 * 2026-08-03 (content deleted, flag off); their admin pages went with them on
 * 2026-09-15. The public product is /retreats (the `journeys` table).
 */
export default async function AdminRetreatsPage() {
  const supabase = await createClient();
  const [journeys, practitioners, partners, places] = await Promise.all([
    supabase.from("journeys").select("id", { count: "exact", head: true }),
    supabase.from("practitioners").select("id", { count: "exact", head: true }),
    supabase.from("partners").select("id", { count: "exact", head: true }),
    supabase.from("places").select("id", { count: "exact", head: true }),
  ]);

  const sections = [
    { href: "/admin/journeys", label: "Retreats", count: journeys.count ?? 0, icon: Sparkles, blurb: "The multi-day threads sold at /retreats." },
    { href: "/admin/practitioners", label: "Practitioners", count: practitioners.count ?? 0, icon: Users, blurb: "People the retreats and guides introduce." },
    { href: "/admin/partners", label: "Partners", count: partners.count ?? 0, icon: Building, blurb: "Venues and businesses credited on retreats." },
    { href: "/admin/places", label: "Places", count: places.count ?? 0, icon: Map, blurb: "Named locations the guides link to." },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Retreats &amp; directory</h1>
        <Button asChild>
          <Link href="/admin/journeys/new">New retreat</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, label, count, icon: Icon, blurb }) => (
          <Card key={href}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <Link href={href} className="hover:underline">{label}</Link>
                <span className="ml-auto text-sm font-normal text-muted-foreground">{count}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{blurb}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
