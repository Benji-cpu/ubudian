"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WEEKDAY_LABELS } from "@/lib/specials";
import { cn } from "@/lib/utils";

export type DealDraft = {
  title: string;
  description: string;
  price: string;
  normal_price: string;
  weekdays: number[];
  start_time: string;
  end_time: string;
};

export const EMPTY_DRAFT: DealDraft = { title: "", description: "", price: "", normal_price: "", weekdays: [], start_time: "", end_time: "" };
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** One deal's fields. Sends `{title, description, price_idr, normal_price_idr, weekdays, start_time, end_time}`. */
export function DealForm({
  initial = EMPTY_DRAFT,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: DealDraft;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const [d, setD] = useState<DealDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof DealDraft, v: DealDraft[keyof DealDraft]) => setD((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const digits = d.price.replace(/[.,\s]/g, "");
    const normalDigits = d.normal_price.replace(/[.,\s]/g, "");
    const err = await onSubmit({
      title: d.title,
      description: d.description,
      price_idr: digits ? Number(digits) : null,
      normal_price_idr: normalDigits ? Number(normalDigits) : null,
      weekdays: d.weekdays,
      start_time: d.start_time,
      end_time: d.end_time,
    });
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="space-y-4 [&_input::placeholder]:text-muted-foreground/45 [&_textarea::placeholder]:text-muted-foreground/45">
      <div className="space-y-1.5">
        <Label htmlFor="deal-title">What is it?</Label>
        <Input id="deal-title" required value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="2-for-1 pizza night" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deal-price">Price in IDR (optional)</Label>
        <Input id="deal-price" inputMode="numeric" value={d.price} onChange={(e) => set("price", e.target.value)} placeholder="95000" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deal-normal-price">Your normal price in IDR (we need this to list it)</Label>
        <Input id="deal-normal-price" inputMode="numeric" value={d.normal_price} onChange={(e) => set("normal_price", e.target.value)} placeholder="190000" />
        <p className="text-xs text-muted-foreground">What the same thing costs without the deal. We list deals at least 25% below it.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Which days?</Label>
        <div className="flex flex-wrap gap-2">
          {DAY_ORDER.map((day) => {
            const on = d.weekdays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => set("weekdays", on ? d.weekdays.filter((x) => x !== day) : [...d.weekdays, day])}
                className={cn(
                  "h-10 min-w-12 rounded-full border px-3 text-sm font-medium transition-colors",
                  on ? "border-brand-deep-green bg-brand-deep-green text-white" : "border-input bg-background hover:border-foreground/40"
                )}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Leave them all off if it runs every day.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="deal-from">From (optional)</Label>
          <Input id="deal-from" type="time" value={d.start_time} onChange={(e) => set("start_time", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-until">Until (optional)</Label>
          <Input id="deal-until" type="time" value={d.end_time} onChange={(e) => set("end_time", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deal-details">Details (optional)</Label>
        <Textarea id="deal-details" rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Dine-in only. Plus tax and service." />
      </div>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
