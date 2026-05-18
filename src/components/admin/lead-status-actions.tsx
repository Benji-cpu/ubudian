"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { SponsorLeadStatus } from "@/types";

const STATUSES: { value: SponsorLeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "dismissed", label: "Dismissed" },
];

export function LeadStatusActions({
  leadId,
  status,
}: {
  leadId: string;
  status: SponsorLeadStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<SponsorLeadStatus>(status);
  const [saving, setSaving] = useState(false);

  async function update(next: SponsorLeadStatus) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sponsor_leads")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", leadId);
    setSaving(false);
    if (error) {
      console.error(error);
      return;
    }
    setCurrent(next);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={current} onValueChange={(v) => update(v as SponsorLeadStatus)} disabled={saving}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
