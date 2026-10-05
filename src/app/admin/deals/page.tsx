import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listForReview } from "@/lib/venue/review";
import { formatHours, formatIdr, formatWeekdays } from "@/lib/specials";
import { DecideButtons } from "./decide-buttons";

export const metadata = { title: "Deals waiting — Admin" };

function describe(p: Record<string, unknown>) {
  return [
    formatWeekdays((p.weekdays as number[]) ?? []),
    formatHours((p.start_time as string) ?? null, (p.end_time as string) ?? null),
    formatIdr((p.price_idr as number) ?? null),
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * What venues sent that isn't live yet. The daily routine
 * (.claude/agents/deals-reviewer.md) decides these; this page shows what it
 * flagged and lets an admin decide by hand if the routine stalls. Anything
 * waiting 14 days is taken down by the nightly run, so this never piles up.
 */
export default async function AdminDealsPage() {
  if (!(await isAdmin())) redirect("/");
  const items = await listForReview();
  const flagged = items.filter((i) => i.previous_note?.startsWith("flag:"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deals waiting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} waiting, {flagged.length} flagged by the daily review. The review runs at 04:13 Bali; anything
          waiting 14 days is taken down automatically.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border p-6 text-muted-foreground">Nothing waiting.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {i.venue_name}
                    {i.venue_area ? ` · ${i.venue_area}` : ""} · {i.kind === "edit" ? "edit to a live deal" : "new deal"}
                  </p>
                  <p className="mt-1 font-medium">{String(i.proposed.title)}</p>
                  <p className="text-sm text-muted-foreground">{describe(i.proposed)}</p>
                  {i.current && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Live now: {String(i.current.title)} · {describe(i.current)}
                    </p>
                  )}
                  {i.previous_note && (
                    <p className={`mt-2 rounded-md p-2 text-sm ${i.previous_note.startsWith("flag:") ? "bg-amber-50 text-amber-900" : "bg-muted"}`}>
                      {i.previous_note}
                    </p>
                  )}
                </div>
                <DecideButtons id={i.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
