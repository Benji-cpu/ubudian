"use client";

/**
 * Testimonials admin (nested in journey edit tab).
 *
 * Scoped to a single journey. Lists testimonials with expand-to-edit,
 * "+ New" inline. Avatar upload, attendee name + origin, day reference,
 * publish toggle, sort_order via drag-target later.
 */

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Plus, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import type { JourneyTestimonial } from "@/types";

interface JourneyTestimonialsAdminProps {
  journeyId: string;
  journeyLengthDays: number;
}

export function JourneyTestimonialsAdmin({
  journeyId,
  journeyLengthDays,
}: JourneyTestimonialsAdminProps) {
  const [items, setItems] = useState<JourneyTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("journey_testimonials")
      .select("*")
      .eq("journey_id", journeyId)
      .order("sort_order");
    setItems((data ?? []) as JourneyTestimonial[]);
    setLoading(false);
  }, [journeyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading testimonials…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} testimonial{items.length === 1 ? "" : "s"} on this retreat
        </p>
        <Button type="button" size="sm" onClick={() => setExpanded("__new__")}>
          <Plus className="mr-2 h-3.5 w-3.5" /> New testimonial
        </Button>
      </div>

      {expanded === "__new__" && (
        <TestimonialEditor
          mode="new"
          journeyId={journeyId}
          journeyLengthDays={journeyLengthDays}
          item={null}
          nextSortOrder={items.length > 0 ? Math.max(...items.map((t) => t.sort_order)) + 1 : 0}
          onClose={() => setExpanded(null)}
          onSaved={() => {
            setExpanded(null);
            refresh();
          }}
        />
      )}

      <ul className="space-y-3">
        {items.length === 0 && expanded !== "__new__" && (
          <li className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
            No testimonials yet. Add the first one once a real attendee has shared a reflection.
          </li>
        )}
        {items.map((t) => (
          <li
            key={t.id}
            className="overflow-hidden rounded-md border border-brand-gold/20 bg-card"
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-brand-cream/30"
            >
              <Avatar name={t.attendee_name} url={t.avatar_url} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.attendee_name}</span>
                  {!t.is_published && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-800">
                      Draft
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm italic text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {t.attendee_origin && (
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
                    {t.attendee_origin}
                    {t.journey_day_referenced && ` · Day ${t.journey_day_referenced}`}
                  </p>
                )}
              </div>
              {expanded === t.id ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {expanded === t.id && (
              <TestimonialEditor
                mode="edit"
                journeyId={journeyId}
                journeyLengthDays={journeyLengthDays}
                item={t}
                nextSortOrder={t.sort_order}
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

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full border border-brand-gold/30 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-deep-green font-serif text-sm font-medium text-brand-gold">
      {initials}
    </span>
  );
}

interface TestimonialEditorProps {
  mode: "new" | "edit";
  journeyId: string;
  journeyLengthDays: number;
  item: JourneyTestimonial | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}

function TestimonialEditor({
  mode,
  journeyId,
  journeyLengthDays,
  item,
  nextSortOrder,
  onClose,
  onSaved,
}: TestimonialEditorProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    attendee_name: item?.attendee_name ?? "",
    attendee_origin: item?.attendee_origin ?? "",
    quote: item?.quote ?? "",
    journey_day_referenced: item?.journey_day_referenced?.toString() ?? "",
    avatar_url: item?.avatar_url ?? "",
    sort_order: (item?.sort_order ?? nextSortOrder).toString(),
    is_published: item?.is_published ?? true,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    if (!form.attendee_name.trim() || !form.quote.trim()) {
      setError("Name and quote are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const day = form.journey_day_referenced ? Number(form.journey_day_referenced) : null;
    const payload: Record<string, unknown> = {
      journey_id: journeyId,
      attendee_name: form.attendee_name,
      attendee_origin: form.attendee_origin || null,
      quote: form.quote,
      journey_day_referenced:
        day && day >= 1 && day <= journeyLengthDays ? day : null,
      avatar_url: form.avatar_url || null,
      sort_order: Number(form.sort_order) || 0,
      is_published: form.is_published,
    };

    let err;
    if (mode === "edit" && item) {
      ({ error: err } = await supabase
        .from("journey_testimonials")
        .update(payload)
        .eq("id", item.id));
    } else {
      ({ error: err } = await supabase.from("journey_testimonials").insert(payload));
    }
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Delete testimonial from "${item.attendee_name}"?`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("journey_testimonials")
      .delete()
      .eq("id", item.id);
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
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Attendee name
              </label>
              <Input
                value={form.attendee_name}
                onChange={(e) => update("attendee_name", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Origin (city / country)
              </label>
              <Input
                value={form.attendee_origin}
                onChange={(e) => update("attendee_origin", e.target.value)}
                placeholder="Berlin · Germany"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Quote
            </label>
            <Textarea
              rows={4}
              value={form.quote}
              onChange={(e) => update("quote", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Day referenced (1–{journeyLengthDays})
              </label>
              <Input
                value={form.journey_day_referenced}
                onChange={(e) => update("journey_day_referenced", e.target.value)}
                placeholder="2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sort order
              </label>
              <Input
                value={form.sort_order}
                onChange={(e) => update("sort_order", e.target.value)}
                type="number"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Checkbox
              checked={form.is_published}
              onCheckedChange={(v) => update("is_published", Boolean(v))}
            />
            <span className="text-sm">Published</span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avatar
            </label>
            <ImageUploader
              bucket="images"
              folder="testimonials"
              value={form.avatar_url}
              onChange={(v) => update("avatar_url", v)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Square crop. Falls back to initials when empty.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "new" ? "Create testimonial" : "Save changes"}
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
