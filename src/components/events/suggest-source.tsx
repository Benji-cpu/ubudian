"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** "Know a teacher, venue or event we're missing?" — feeds the weekly source research. */
export function SuggestSource() {
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 3) return;
    setState("sending");
    try {
      const res = await fetch("/api/events/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, website }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(json.error ?? "Could not send. Try again?");
        return;
      }
      setState("done");
      setBody("");
    } catch {
      setState("error");
      setMessage("Could not send. Try again?");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-brand-gold/25 bg-brand-gold/5 p-5">
        <h2 className="font-serif text-lg font-semibold text-brand-deep-green">
          Know a teacher, venue or event we&apos;re missing?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop their Instagram handle or a link. We check every week and add the ones that run events here.
        </p>
        {state === "done" ? (
          <p className="mt-3 text-sm font-medium text-brand-deep-green">Thanks, got it.</p>
        ) : (
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="@their.handle or a link"
              aria-label="Instagram handle or link"
              maxLength={500}
              className="sm:max-w-md"
            />
            {/* Honeypot: hidden from people, filled by bots. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              aria-hidden="true"
              name="website"
            />
            <Button type="submit" disabled={state === "sending" || body.trim().length < 3}>
              {state === "sending" ? "Sending…" : "Send"}
            </Button>
          </form>
        )}
        {state === "error" && <p className="mt-2 text-sm text-destructive">{message}</p>}
      </div>
    </section>
  );
}
