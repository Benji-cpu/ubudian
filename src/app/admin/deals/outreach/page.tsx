import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { instagramQueue, IG_PER_DAY } from "@/lib/deals/outreach";
import { DmRow } from "./dm-row";

export const metadata = { title: "Venue outreach — Admin" };
export const dynamic = "force-dynamic";

/** Today's hand-sent outreach: Instagram DMs from Ben's own account, and walk-in cards by area. */
export default async function OutreachPage() {
  if (!(await isAdmin())) redirect("/");
  const queue = await instagramQueue();
  const { data: areas } = await createAdminClient().from("deal_venues").select("area").is("last_contacted_at", null).is("contact_email", null).is("instagram_handle", null).is("opted_out_at", null).is("closed_at", null);
  const counts = new Map<string, number>();
  for (const a of areas ?? []) if (a.area) counts.set(a.area, (counts.get(a.area) ?? 0) + 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Venue outreach</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask each venue what deals it runs. Emails go out by script; these are the ones you send by hand.{" "}
          <Link href="/admin/deals/venues" className="underline underline-offset-2">Pipeline</Link>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Instagram today ({queue.length} of {IG_PER_DAY})</h2>
        <p className="text-sm text-muted-foreground">Open the profile, paste the text into a DM from your own account, then tap Sent.</p>
        {queue.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-muted-foreground">Nobody left to DM. The nightly check finds more handles.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {queue.map((v) => (
              <DmRow key={v.id} venueId={v.id} name={v.name} handle={v.instagram_handle!} text={v.text} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Walk-in cards</h2>
        <p className="text-sm text-muted-foreground">Venues with no email or Instagram, by area. Print a sheet, walk the street, hand one over.</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([area, n]) => (
            <li key={area}>
              <Link href={`/admin/deals/cards?area=${encodeURIComponent(area)}`} className="block rounded-lg border bg-card p-3 text-sm">
                <span className="font-medium">{area}</span>
                <span className="block text-muted-foreground">{n} venues</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
