"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WEEKDAY_LABELS } from "@/lib/specials";
import { cn } from "@/lib/utils";

type State = "idle" | "loading" | "done" | "error";

async function send(token: string, body: Record<string, unknown>): Promise<string | null> {
  const res = await fetch(`/api/venue-invite/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return res.ok ? null : (json?.error ?? "Something went wrong. Please try again.");
}

const toIdr = (v: string) => {
  const n = Number(v.replace(/[^\d]/g, ""));
  return v.trim() && Number.isFinite(n) ? n : null;
};

// Monday first, the way a venue reads its week.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function InviteForm({ token, examples = [] }: { token: string; examples?: string[] }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [f, setF] = useState({ title: "", details: "", start_time: "", end_time: "", price: "", normal: "", contact_name: "", contact_phone: "", website: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (state === "done") {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-brand-cream p-3 text-sm">Thank you! We check new deals every night; most are live by the next morning.</p>
        <Button variant="outline" onClick={() => { setF({ ...f, title: "", details: "", price: "", normal: "" }); setDays([]); setState("idle"); }}>
          Add another deal
        </Button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const err = await send(token, {
      action: "deal",
      title: f.title,
      details: f.details,
      weekdays: days,
      start_time: f.start_time,
      end_time: f.end_time,
      price_idr: toIdr(f.price),
      normal_price_idr: toIdr(f.normal),
      contact_name: f.contact_name,
      contact_phone: f.contact_phone,
      website: f.website,
    });
    if (err) {
      setError(err);
      setState("error");
    } else setState("done");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium" htmlFor="title">Your deal</label>
        {examples.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setF({ ...f, title: x })}
                className={cn("rounded-full border px-3 py-1 text-left text-sm", f.title === x ? "border-brand-deep-green bg-brand-deep-green text-white" : "border-brand-gold/40 bg-brand-cream/60")}
              >
                {x}
              </button>
            ))}
          </div>
        )}
        <Input id="title" className="mt-2" required minLength={3} maxLength={80} value={f.title} onChange={set("title")} placeholder={examples.length ? "Tap one above, or write your own" : "e.g. 2-for-1 pizza, or 30% off massages before noon"} />
      </div>
      <div>
        <p className="text-sm font-medium">Which days? <span className="font-normal text-muted-foreground">(none = every day)</span></p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
              className={cn("rounded-full border px-3 py-1 text-sm", days.includes(d) ? "border-brand-deep-green bg-brand-deep-green text-white" : "bg-background")}
            >
              {WEEKDAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium" htmlFor="start">From</label>
          <Input id="start" type="time" value={f.start_time} onChange={set("start_time")} />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="end">Until</label>
          <Input id="end" type="time" value={f.end_time} onChange={set("end_time")} />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="price">Deal price (IDR)</label>
          <Input id="price" inputMode="numeric" value={f.price} onChange={set("price")} placeholder="optional" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="normal">Normal price (IDR)</label>
          <Input id="normal" inputMode="numeric" value={f.normal} onChange={set("normal")} placeholder="optional" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="details">Anything else? <span className="font-normal text-muted-foreground">(optional)</span></label>
        <Textarea id="details" maxLength={300} rows={2} value={f.details} onChange={set("details")} placeholder="e.g. dine-in only, until the end of October" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium" htmlFor="cname">Your name</label>
          <Input id="cname" maxLength={80} value={f.contact_name} onChange={set("contact_name")} placeholder="optional" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="cphone">Your WhatsApp</label>
          <Input id="cphone" maxLength={30} value={f.contact_phone} onChange={set("contact_phone")} placeholder="optional" />
        </div>
      </div>
      <input type="text" name="website" value={f.website} onChange={set("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state === "error" && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={state === "loading"} className="w-full">
        {state === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send it
      </Button>
    </form>
  );
}

export function FoundYes({ token, specialId }: { token: string; specialId: string }) {
  const [state, setState] = useState<State>("idle");
  if (state === "done") return <p className="mt-2 text-sm text-brand-deep-green">Thank you! It goes live after tonight&apos;s check.</p>;
  return (
    <Button
      size="sm"
      className="mt-3"
      disabled={state === "loading"}
      onClick={async () => {
        setState("loading");
        setState((await send(token, { action: "yes", special_id: specialId })) ? "error" : "done");
      }}
    >
      {state === "error" ? "Try again" : "Yes, it's on: list it"}
    </Button>
  );
}

export function OptOut({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");
  if (state === "done") return <p className="text-center text-sm text-muted-foreground">Done. We won&apos;t contact you again.</p>;
  return (
    <button
      type="button"
      className="mx-auto block text-sm text-muted-foreground underline underline-offset-4"
      onClick={async () => {
        setState("loading");
        setState((await send(token, { action: "optout" })) ? "error" : "done");
      }}
    >
      Not for us, thanks
    </button>
  );
}
