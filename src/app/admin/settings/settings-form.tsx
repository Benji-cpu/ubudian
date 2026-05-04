"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SiteSettings } from "@/lib/site-settings";

type SectionKey = keyof SiteSettings;

const SECTIONS: { key: SectionKey; label: string; description: string }[] = [
  {
    key: "stories_enabled",
    label: "Humans of Ubud",
    description: "Public access to /stories and all individual story pages.",
  },
  {
    key: "tours_enabled",
    label: "Tours",
    description: "Public access to /tours, tour detail pages, and the tour booking checkout.",
  },
  {
    key: "blog_enabled",
    label: "Blog",
    description: "Public access to /blog and all blog posts.",
  },
  {
    key: "newsletter_archive_enabled",
    label: "Newsletter archive",
    description: "Public access to /newsletter and past editions. Signup stays on everywhere regardless.",
  },
];

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [values, setValues] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const dirty =
    values.blog_enabled !== initial.blog_enabled ||
    values.stories_enabled !== initial.stories_enabled ||
    values.tours_enabled !== initial.tours_enabled ||
    values.newsletter_archive_enabled !== initial.newsletter_archive_enabled;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save settings");
      }

      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <ul className="divide-y">
        {SECTIONS.map((section) => (
          <li key={section.key} className="flex items-start justify-between gap-6 px-6 py-5">
            <div className="flex-1">
              <div className="font-medium">{section.label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            </div>
            <Switch
              checked={values[section.key]}
              onCheckedChange={(checked) =>
                setValues((prev) => ({ ...prev, [section.key]: checked }))
              }
              aria-label={`Toggle ${section.label}`}
            />
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
        <span className="text-sm text-muted-foreground">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
