"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { k: "venue_name", label: "Venue name", required: true, placeholder: "Warung Example" },
  { k: "venue_area", label: "Area (optional)", placeholder: "Penestanan" },
  { k: "instagram_handle", label: "Instagram (optional)", placeholder: "@yourplace" },
  { k: "contact_name", label: "Your name", required: true },
  { k: "contact_phone", label: "WhatsApp number", required: true, placeholder: "+62 812 …" },
  { k: "contact_email", label: "Email (optional)" },
] as const;

/** For a venue we haven't listed yet. Private contact fields are never shown on the site. */
export function NewVenueForm() {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4 [&_input::placeholder]:text-muted-foreground/45"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await fetch("/api/venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
        const json = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok || json.error) setError(json.error || "Something went wrong.");
        else router.refresh();
      }}
    >
      {FIELDS.map((f) => (
        <div key={f.k} className="space-y-1.5">
          <Label htmlFor={`v-${f.k}`}>{f.label}</Label>
          <Input
            id={`v-${f.k}`}
            required={"required" in f && f.required}
            placeholder={"placeholder" in f ? f.placeholder : undefined}
            value={v[f.k] ?? ""}
            onChange={(e) => setV((p) => ({ ...p, [f.k]: e.target.value }))}
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Your name, number and email are never shown on the site.</p>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Add my venue
      </Button>
    </form>
  );
}
