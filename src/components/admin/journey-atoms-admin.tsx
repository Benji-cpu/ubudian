"use client";

/**
 * Atoms admin (nested in journey edit tab).
 *
 * Atoms are global building blocks shared across journeys — kept that way for
 * reuse (the Cacao ritual atom belongs to many retreats). This component
 * lists every atom, with expand-to-edit per row and an inline "New Atom"
 * card. Admin can change image, kind, theme tags, archetype tags, lat/lng,
 * image credit + credit URL, FK to practitioner / partner, and toggle active.
 *
 * Saving uses the browser Supabase client + RLS-allowed admin update.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/admin/image-uploader";
import { TagInput } from "@/components/admin/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  ImageIcon,
} from "lucide-react";
import type { JourneyAtom, JourneyAtomKind, Practitioner, Partner } from "@/types";

const KIND_OPTIONS: { value: JourneyAtomKind; label: string }[] = [
  { value: "event_ref", label: "Event reference" },
  { value: "accommodation", label: "Accommodation" },
  { value: "restaurant", label: "Restaurant" },
  { value: "practitioner", label: "Practitioner" },
  { value: "place", label: "Place" },
  { value: "ritual", label: "Ritual" },
  { value: "reflection", label: "Reflection" },
];

const KIND_TONE: Record<JourneyAtomKind, string> = {
  event_ref: "bg-brand-gold/15 text-brand-deep-green",
  accommodation: "bg-brand-deep-green/10 text-brand-deep-green",
  restaurant: "bg-brand-terracotta/15 text-brand-terracotta",
  practitioner: "bg-emerald-100 text-emerald-800",
  place: "bg-amber-100 text-amber-800",
  ritual: "bg-violet-100 text-violet-800",
  reflection: "bg-slate-100 text-slate-700",
};

const COMMON_THEME_TAGS = [
  "temple",
  "water",
  "purification",
  "breath",
  "grounding",
  "ritual",
  "shadow",
  "intimacy",
  "movement",
  "sound",
  "food",
  "rest",
  "walk",
  "sunrise",
  "evening",
  "ceremony",
  "ecstatic",
  "tantra",
  "yoga",
  "cacao",
];

export function JourneyAtomsAdmin() {
  const [atoms, setAtoms] = useState<JourneyAtom[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | JourneyAtomKind>("all");

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [atomsRes, practitionersRes, partnersRes] = await Promise.all([
      supabase.from("journey_atoms").select("*").order("kind").order("title"),
      supabase.from("practitioners").select("*").order("name"),
      supabase.from("partners").select("*").order("name"),
    ]);
    setAtoms((atomsRes.data ?? []) as JourneyAtom[]);
    setPractitioners((practitionersRes.data ?? []) as Practitioner[]);
    setPartners((partnersRes.data ?? []) as Partner[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () => (filter === "all" ? atoms : atoms.filter((a) => a.kind === filter)),
    [atoms, filter]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading atoms…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {atoms.length} atoms total · shared across all retreats
        </p>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds</SelectItem>
              {KIND_OPTIONS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={() => setExpanded("__new__")}
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> New atom
          </Button>
        </div>
      </div>

      {expanded === "__new__" && (
        <AtomEditor
          mode="new"
          atom={null}
          practitioners={practitioners}
          partners={partners}
          onClose={() => setExpanded(null)}
          onSaved={() => {
            setExpanded(null);
            refresh();
          }}
        />
      )}

      <ul className="space-y-3">
        {filtered.length === 0 && (
          <li className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
            No atoms with that filter.
          </li>
        )}
        {filtered.map((atom) => (
          <li
            key={atom.id}
            className="overflow-hidden rounded-md border border-brand-gold/20 bg-card"
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === atom.id ? null : atom.id)}
              className="flex w-full items-center gap-4 p-3 text-left transition-colors hover:bg-brand-cream/30"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-muted">
                {atom.image_url ? (
                  <Image src={atom.image_url} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${KIND_TONE[atom.kind]}`}>
                    {atom.kind.replace("_", " ")}
                  </Badge>
                  {!atom.is_active && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      Hidden
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate font-medium">{atom.title}</p>
                {atom.short_description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {atom.short_description}
                  </p>
                )}
              </div>
              {expanded === atom.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expanded === atom.id && (
              <AtomEditor
                mode="edit"
                atom={atom}
                practitioners={practitioners}
                partners={partners}
                onClose={() => setExpanded(null)}
                onSaved={() => {
                  setExpanded(null);
                  refresh();
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AtomEditorProps {
  mode: "new" | "edit";
  atom: JourneyAtom | null;
  practitioners: Practitioner[];
  partners: Partner[];
  onClose: () => void;
  onSaved: () => void;
}

function AtomEditor({
  mode,
  atom,
  practitioners,
  partners,
  onClose,
  onSaved,
}: AtomEditorProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    kind: (atom?.kind ?? "place") as JourneyAtomKind,
    title: atom?.title ?? "",
    short_description: atom?.short_description ?? "",
    description: atom?.description ?? "",
    image_url: atom?.image_url ?? "",
    image_credit: atom?.image_credit ?? "",
    image_credit_url: atom?.image_credit_url ?? "",
    affiliate_url: atom?.affiliate_url ?? "",
    google_maps_url: atom?.google_maps_url ?? "",
    latitude: atom?.latitude?.toString() ?? "",
    longitude: atom?.longitude?.toString() ?? "",
    practitioner_id: atom?.practitioner_id ?? "",
    partner_id: atom?.partner_id ?? "",
    is_active: atom?.is_active ?? true,
    theme_tags: atom?.theme_tags ?? [],
    archetype_tags: (atom?.archetype_tags ?? []) as string[],
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const lat = form.latitude ? Number(form.latitude) : null;
    const lng = form.longitude ? Number(form.longitude) : null;
    if ((form.latitude && Number.isNaN(lat as number)) || (form.longitude && Number.isNaN(lng as number))) {
      setError("Latitude and longitude must be numbers.");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      kind: form.kind,
      title: form.title,
      short_description: form.short_description || null,
      description: form.description || null,
      image_url: form.image_url || null,
      image_credit: form.image_credit || null,
      image_credit_url: form.image_credit_url || null,
      affiliate_url: form.affiliate_url || null,
      google_maps_url: form.google_maps_url || null,
      latitude: lat,
      longitude: lng,
      practitioner_id: form.practitioner_id || null,
      partner_id: form.partner_id || null,
      is_active: form.is_active,
      theme_tags: form.theme_tags,
      archetype_tags: form.archetype_tags,
    };

    let err;
    if (mode === "edit" && atom) {
      ({ error: err } = await supabase.from("journey_atoms").update(payload).eq("id", atom.id));
    } else {
      ({ error: err } = await supabase.from("journey_atoms").insert(payload));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    if (!atom) return;
    if (!confirm(`Delete atom "${atom.title}"? Slots referencing it lose the curated link.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("journey_atoms").delete().eq("id", atom.id);
    setDeleting(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="border-t border-brand-gold/15 bg-brand-cream/20 p-5">
      {error && (
        <div className="mb-3 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Short description (one line)
            </label>
            <Input
              value={form.short_description}
              onChange={(e) => update("short_description", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Long description (markdown)
            </label>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Theme tags
            </label>
            <TagInput
              options={COMMON_THEME_TAGS}
              value={form.theme_tags}
              onChange={(v) => update("theme_tags", v)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Archetype tags
            </label>
            <TagInput
              options={[...ARCHETYPE_IDS]}
              value={form.archetype_tags}
              onChange={(v) => update("archetype_tags", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Latitude
              </label>
              <Input
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                placeholder="-8.5176"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Longitude
              </label>
              <Input
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                placeholder="115.2613"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Google Maps URL
            </label>
            <Input
              value={form.google_maps_url}
              onChange={(e) => update("google_maps_url", e.target.value)}
              placeholder="https://maps.google.com/?q=…"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Affiliate URL
            </label>
            <Input
              value={form.affiliate_url}
              onChange={(e) => update("affiliate_url", e.target.value)}
              placeholder="https://…?ref=ubudian"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Checkbox
              checked={form.is_active}
              onCheckedChange={(v) => update("is_active", Boolean(v))}
            />
            <span className="text-sm">Active</span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kind
            </label>
            <Select
              value={form.kind}
              onValueChange={(v) => update("kind", v as JourneyAtomKind)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Image
            </label>
            <ImageUploader
              bucket="images"
              folder="experiences"
              value={form.image_url}
              onChange={(v) => update("image_url", v)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Image credit (caption)
            </label>
            <Input
              value={form.image_credit}
              onChange={(e) => update("image_credit", e.target.value)}
              placeholder="Photo: @hujanlocale"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Image credit URL
            </label>
            <Input
              value={form.image_credit_url}
              onChange={(e) => update("image_credit_url", e.target.value)}
              placeholder="https://instagram.com/…"
            />
          </div>

          {form.kind === "practitioner" && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Practitioner FK
              </label>
              <Select
                value={form.practitioner_id || "__none__"}
                onValueChange={(v) => update("practitioner_id", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {practitioners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(form.kind === "accommodation" ||
            form.kind === "restaurant" ||
            form.kind === "place") && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Partner FK (optional)
              </label>
              <Select
                value={form.partner_id || "__none__"}
                onValueChange={(v) => update("partner_id", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "new" ? "Create atom" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving || deleting}>
          Cancel
        </Button>
        <div className="flex-1" />
        {mode === "edit" && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
