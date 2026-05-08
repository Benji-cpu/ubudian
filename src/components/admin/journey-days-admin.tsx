"use client";

/**
 * Days admin (nested in journey edit tab — lite version).
 *
 * Lists journey_days for a journey, expand-to-edit per row, "+ New day"
 * inline. Lets the admin set theme, theme_subtitle, intention, day_type,
 * background_image_url. Slot-grid management deferred to a future wave —
 * for now days are editable but slots inside a day are managed via SQL.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/admin/image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import type { JourneyDay, JourneyDayType } from "@/types";

const DAY_TYPES: { value: JourneyDayType; label: string }[] = [
  { value: "arrival", label: "Arrival" },
  { value: "light", label: "Light" },
  { value: "active", label: "Active" },
  { value: "rest", label: "Rest" },
  { value: "closing", label: "Closing" },
];

interface JourneyDaysAdminProps {
  journeyId: string;
  journeyLengthDays: number;
}

export function JourneyDaysAdmin({ journeyId, journeyLengthDays }: JourneyDaysAdminProps) {
  const [days, setDays] = useState<JourneyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("journey_days")
      .select("*")
      .eq("journey_id", journeyId)
      .order("day_number");
    setDays((data ?? []) as JourneyDay[]);
    setLoading(false);
  }, [journeyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading days…
      </div>
    );
  }

  const nextDayNumber = days.length > 0 ? Math.max(...days.map((d) => d.day_number)) + 1 : 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {days.length} of {journeyLengthDays} day{journeyLengthDays === 1 ? "" : "s"} authored.
          Slot management for each day is still SQL-only (Wave 4).
        </p>
        {days.length < journeyLengthDays && (
          <Button type="button" size="sm" onClick={() => setExpanded("__new__")}>
            <Plus className="mr-2 h-3.5 w-3.5" /> New day
          </Button>
        )}
      </div>

      {expanded === "__new__" && (
        <DayEditor
          mode="new"
          journeyId={journeyId}
          day={null}
          nextDayNumber={nextDayNumber}
          maxDay={journeyLengthDays}
          onClose={() => setExpanded(null)}
          onSaved={() => {
            setExpanded(null);
            refresh();
          }}
        />
      )}

      <ul className="space-y-3">
        {days.length === 0 && expanded !== "__new__" && (
          <li className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
            No days yet. Add Day 1.
          </li>
        )}
        {days.map((d) => (
          <li
            key={d.id}
            className="overflow-hidden rounded-md border border-brand-gold/20 bg-card"
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              className="flex w-full items-start gap-4 p-3 text-left transition-colors hover:bg-brand-cream/30"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-muted">
                {d.background_image_url ? (
                  <Image
                    src={d.background_image_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-serif text-sm font-medium text-brand-deep-green">
                    {d.day_number}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-brand-gold">
                    Day {d.day_number} · {d.day_type}
                  </span>
                </div>
                <p className="truncate font-medium">{d.theme}</p>
                {d.theme_subtitle && (
                  <p className="truncate text-xs italic text-muted-foreground">
                    {d.theme_subtitle}
                  </p>
                )}
              </div>
              {expanded === d.id ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {expanded === d.id && (
              <DayEditor
                mode="edit"
                journeyId={journeyId}
                day={d}
                nextDayNumber={d.day_number}
                maxDay={journeyLengthDays}
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

interface DayEditorProps {
  mode: "new" | "edit";
  journeyId: string;
  day: JourneyDay | null;
  nextDayNumber: number;
  maxDay: number;
  onClose: () => void;
  onSaved: () => void;
}

function DayEditor({ mode, journeyId, day, nextDayNumber, maxDay, onClose, onSaved }: DayEditorProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    day_number: (day?.day_number ?? nextDayNumber).toString(),
    day_type: (day?.day_type ?? "light") as JourneyDayType,
    theme: day?.theme ?? "",
    theme_subtitle: day?.theme_subtitle ?? "",
    intention: day?.intention ?? "",
    background_image_url: day?.background_image_url ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    if (!form.theme.trim()) {
      setError("Theme is required.");
      return;
    }
    const dayNum = Number(form.day_number);
    if (!dayNum || dayNum < 1 || dayNum > maxDay) {
      setError(`Day number must be between 1 and ${maxDay}.`);
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      journey_id: journeyId,
      day_number: dayNum,
      day_type: form.day_type,
      theme: form.theme,
      theme_subtitle: form.theme_subtitle || null,
      intention: form.intention || null,
      background_image_url: form.background_image_url || null,
    };

    let err;
    if (mode === "edit" && day) {
      ({ error: err } = await supabase.from("journey_days").update(payload).eq("id", day.id));
    } else {
      ({ error: err } = await supabase.from("journey_days").insert(payload));
    }
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    if (!day) return;
    if (!confirm(`Delete Day ${day.day_number}: "${day.theme}"? Slots cascade.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("journey_days").delete().eq("id", day.id);
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
                Day number
              </label>
              <Input
                value={form.day_number}
                onChange={(e) => update("day_number", e.target.value)}
                type="number"
                min={1}
                max={maxDay}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Day type
              </label>
              <Select
                value={form.day_type}
                onValueChange={(v) => update("day_type", v as JourneyDayType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Theme
            </label>
            <Input
              value={form.theme}
              onChange={(e) => update("theme", e.target.value)}
              placeholder="The threshold"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Subtitle
            </label>
            <Input
              value={form.theme_subtitle}
              onChange={(e) => update("theme_subtitle", e.target.value)}
              placeholder="One italic line under the theme"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Intention (markdown)
            </label>
            <Textarea
              rows={4}
              value={form.intention}
              onChange={(e) => update("intention", e.target.value)}
              placeholder="What this day is for. Two or three sentences."
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Background image
          </label>
          <ImageUploader
            bucket="images"
            folder="experiences"
            value={form.background_image_url}
            onChange={(v) => update("background_image_url", v)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Used as a faint background behind the day&apos;s header.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "new" ? "Create day" : "Save changes"}
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
