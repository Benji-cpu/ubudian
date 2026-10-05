"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatHours, formatIdr, formatWeekdays } from "@/lib/specials";
import { DealForm, type DealDraft } from "./deal-form";
import type { DealVenue, OwnerDeal } from "@/lib/venue";

async function send(url: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return res.ok && !json.error ? null : json.error || "Something went wrong.";
}

function toDraft(d: OwnerDeal): DealDraft {
  const p = (d.pending_changes ?? {}) as Partial<OwnerDeal>;
  const v = { ...d, ...p };
  return {
    title: v.title ?? "",
    description: v.description ?? "",
    price: v.price_idr ? String(v.price_idr) : "",
    weekdays: v.weekdays ?? [],
    start_time: v.start_time?.slice(0, 5) ?? "",
    end_time: v.end_time?.slice(0, 5) ?? "",
  };
}

function StatusBadge({ deal }: { deal: OwnerDeal }) {
  const [label, cls] =
    deal.status === "live" && deal.pending_changes
      ? ["Live · change waiting for review", "bg-amber-100 text-amber-900"]
      : deal.status === "live"
        ? ["Live", "bg-emerald-100 text-emerald-900"]
        : deal.status === "pending"
          ? ["Waiting for review", "bg-amber-100 text-amber-900"]
          : ["Not shown", "bg-muted text-muted-foreground"];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

export function VenueDeals({ venue, deals }: { venue: DealVenue; deals: OwnerDeal[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(deals.length === 0 ? "new" : null);
  const [notice, setNotice] = useState<string | null>(null);
  const base = `/api/venue/${venue.id}/deals`;
  const done = (msg: string) => {
    setEditing(null);
    setNotice(msg);
    router.refresh();
  };

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">{venue.name}</h2>
        {venue.area && <span className="text-sm text-muted-foreground">{venue.area}</span>}
      </div>
      {notice && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}

      <ul className="mt-4 space-y-3">
        {deals.map((d) => (
          <li key={d.id} className="rounded-xl border p-4">
            {editing === d.id ? (
              <DealForm
                initial={toDraft(d)}
                submitLabel="Save change"
                onCancel={() => setEditing(null)}
                onSubmit={async (body) => {
                  const err = await send(`${base}/${d.id}`, "PATCH", body);
                  if (!err) done("Saved. We check changes every night; most are live by the next morning.");
                  return err;
                }}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{d.title}</p>
                  <StatusBadge deal={d} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden />
                  {[d.days_stated ? formatWeekdays(d.weekdays) : "Days not stated", formatHours(d.start_time, d.end_time), formatIdr(d.price_idr)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {d.review_note && d.status !== "live" && (
                  <p className="mt-2 rounded-md bg-muted p-2 text-sm text-muted-foreground">Note from our review: {d.review_note}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(d.id)}>
                    Edit
                  </Button>
                  {d.status !== "hidden" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm(`Take "${d.title}" down? It comes off the site straight away.`)) return;
                        const err = await send(`${base}/${d.id}`, "DELETE");
                        if (err) setNotice(err);
                        else done("Taken down.");
                      }}
                    >
                      Take down
                    </Button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {editing === "new" ? (
          <div className="rounded-xl border border-dashed p-4">
            <p className="mb-3 font-medium">New deal</p>
            <DealForm
              submitLabel="Send for review"
              onCancel={deals.length ? () => setEditing(null) : undefined}
              onSubmit={async (body) => {
                const err = await send(base, "POST", body);
                if (!err) done("Sent. We check new deals every night; most are live by the next morning.");
                return err;
              }}
            />
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add a deal
          </Button>
        )}
      </div>
    </section>
  );
}
