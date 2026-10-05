"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatHours, formatIdr, formatWeekdays } from "@/lib/specials";
import type { Special } from "@/types";

export function ReconfirmForm({ token, specials }: { token: string; specials: Special[] }) {
  const [running, setRunning] = useState<Set<string>>(() => new Set(specials.map((s) => s.id)));
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (specials.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Nothing is listed for you right now.{" "}
        <Link href="/tonight/add" className="font-medium text-brand-deep-green underline underline-offset-4">
          Add a deal
        </Link>
        .
      </p>
    );
  }

  async function submit() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/specials/reconfirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, stopped: specials.filter((s) => !running.has(s.id)).map((s) => s.id) }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Something went wrong.");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    const kept = running.size;
    return (
      <div className="rounded-xl border border-brand-gold/20 bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-deep-green dark:text-brand-gold" />
        <h2 className="mt-4 font-serif text-2xl text-brand-deep-green dark:text-brand-gold">Thank you</h2>
        <p className="mt-2 text-muted-foreground">
          {kept > 0
            ? `${kept === 1 ? "Your deal stays" : `${kept} deals stay`} on The Ubudian for another month.`
            : "We've taken your deals down."}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/tonight">See Tonight in Ubud</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tonight/add">Add a new deal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {specials.map((s) => {
          const on = running.has(s.id);
          const meta = [formatWeekdays(s.weekdays), formatHours(s.start_time, s.end_time), formatIdr(s.price_idr)]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={s.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-gold/20 bg-card p-4">
                <Checkbox
                  checked={on}
                  onCheckedChange={(v) =>
                    setRunning((prev) => {
                      const next = new Set(prev);
                      if (v) next.add(s.id);
                      else next.delete(s.id);
                      return next;
                    })
                  }
                  className="mt-1"
                  aria-label={`${s.title} is still running`}
                />
                <span>
                  <span className={on ? "font-medium" : "font-medium text-muted-foreground line-through"}>{s.title}</span>
                  <span className="block text-sm text-muted-foreground">{meta}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {status === "error" && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button size="lg" className="w-full" onClick={submit} disabled={status === "loading"}>
        {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {running.size === specials.length
          ? "Yes, all still running"
          : running.size === 0
            ? "Take them all down"
            : `Keep ${running.size}, take down ${specials.length - running.size}`}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Prices or days changed? <Link href="/tonight/add" className="underline underline-offset-4">Add the new version</Link> and untick the old one.
      </p>
    </div>
  );
}
