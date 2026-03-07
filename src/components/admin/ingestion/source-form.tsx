"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { EventSource, SourceType } from "@/types";

const sourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  source_type: z.enum([
    "telegram",
    "api",
    "scraper",
    "whatsapp",
    "facebook",
    "instagram",
    "manual",
  ]),
  is_enabled: z.boolean(),
  fetch_interval_minutes: z.number().int().min(5),
  config_json: z.string(),
});

type SourceFormData = z.infer<typeof sourceSchema>;

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "telegram", label: "Telegram" },
  { value: "api", label: "API" },
  { value: "scraper", label: "Web Scraper" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "manual", label: "Manual" },
];

export function SourceForm({ source }: { source?: EventSource }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: source?.name || "",
      source_type: source?.source_type || "api",
      is_enabled: source?.is_enabled ?? true,
      fetch_interval_minutes: source?.fetch_interval_minutes || 240,
      config_json: source?.config ? JSON.stringify(source.config, null, 2) : "{}",
    },
  });

  const isEnabled = watch("is_enabled");

  async function onSubmit(data: SourceFormData) {
    setSaving(true);
    setError(null);

    let config: Record<string, unknown>;
    try {
      config = JSON.parse(data.config_json);
    } catch {
      setError("Invalid JSON in config");
      setSaving(false);
      return;
    }

    try {
      const url = source
        ? `/api/admin/ingestion/sources/${source.id}`
        : "/api/admin/ingestion/sources";

      const res = await fetch(url, {
        method: source ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          source_type: data.source_type,
          is_enabled: data.is_enabled,
          fetch_interval_minutes: data.fetch_interval_minutes,
          config,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save source");
        return;
      }

      router.push("/admin/ingestion/sources");
      router.refresh();
    } catch {
      setError("Failed to save source");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Source Name</Label>
        <Input id="name" {...register("name")} placeholder="e.g., AllEvents.in Ubud" />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="source_type">Source Type</Label>
        <Select
          defaultValue={source?.source_type || "api"}
          onValueChange={(v) => setValue("source_type", v as SourceType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fetch_interval_minutes">Fetch Interval (minutes)</Label>
        <Input
          id="fetch_interval_minutes"
          type="number"
          min={5}
          {...register("fetch_interval_minutes", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          How often to fetch from this source (min 5 minutes). Default: 240 (4 hours).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="is_enabled"
          checked={isEnabled}
          onCheckedChange={(checked) => setValue("is_enabled", checked)}
        />
        <Label htmlFor="is_enabled">Enabled</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="config_json">Configuration (JSON)</Label>
        <Textarea
          id="config_json"
          {...register("config_json")}
          rows={8}
          className="font-mono text-sm"
          placeholder='{"key": "value"}'
        />
        <p className="text-xs text-muted-foreground">
          Adapter-specific configuration. Check adapter docs for available options.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {source ? "Update Source" : "Create Source"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
