"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import type { Sponsor, SponsorshipEntityType } from "@/types";

interface SponsorshipAttachProps {
  entityType: SponsorshipEntityType;
  entityId: string;
  label?: string;
  description?: string;
}

const NONE_VALUE = "__none__";

/**
 * Embedded panel — pick the community partner attached to this entity.
 * Enforces "one active sponsorship per entity": picking a new sponsor clears
 * any previous active sponsorship before inserting.
 */
export function SponsorshipAttach({
  entityType,
  entityId,
  label = "Community Partner",
  description = "Optional — pick a partner who sponsors this. Renders a subtle 'in partnership with' credit on the public page.",
}: SponsorshipAttachProps) {
  const [sponsors, setSponsors] = useState<Sponsor[] | null>(null);
  const [currentSponsorId, setCurrentSponsorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const [sponsorRes, sponsorshipRes] = await Promise.all([
        supabase
          .from("sponsors")
          .select("*")
          .eq("status", "active")
          .order("name", { ascending: true }),
        supabase
          .from("sponsorships")
          .select("sponsor_id, ends_at, starts_at")
          .eq("entity_type", entityType)
          .eq("entity_id", entityId)
          .order("starts_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setSponsors(((sponsorRes.data as Sponsor[]) ?? []));

      const row = sponsorshipRes.data as { sponsor_id: string; ends_at: string | null } | null;
      if (row) {
        const stillActive = !row.ends_at || new Date(row.ends_at) > new Date();
        setCurrentSponsorId(stillActive ? row.sponsor_id : null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  async function pickSponsor(value: string) {
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const nowIso = new Date().toISOString();
    const newSponsorId = value === NONE_VALUE ? null : value;

    // Close any open sponsorship for this entity (set ends_at = now where ends_at IS NULL).
    const { error: closeErr } = await supabase
      .from("sponsorships")
      .update({ ends_at: nowIso })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .is("ends_at", null);

    if (closeErr) {
      setSaving(false);
      setError(closeErr.message);
      return;
    }

    if (newSponsorId) {
      const { error: insertErr } = await supabase.from("sponsorships").insert({
        sponsor_id: newSponsorId,
        entity_type: entityType,
        entity_id: entityId,
        starts_at: nowIso,
      });
      if (insertErr) {
        setSaving(false);
        setError(insertErr.message);
        return;
      }
    }

    setCurrentSponsorId(newSponsorId);
    setSaving(false);
  }

  if (sponsors === null) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="text-xs text-muted-foreground">Loading partners…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div>
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {sponsors.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No active partners yet. Add one in <a href="/admin/sponsors" className="underline">Partners</a>.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <Select
            value={currentSponsorId ?? NONE_VALUE}
            onValueChange={pickSponsor}
            disabled={saving}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="No partner attached" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— No partner —</SelectItem>
              {sponsors.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {currentSponsorId && !saving && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => pickSponsor(NONE_VALUE)}
              aria-label="Clear partner"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
