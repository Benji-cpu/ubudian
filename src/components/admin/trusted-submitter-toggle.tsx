"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";

interface TrustedSubmitterToggleProps {
  email: string;
  initialValue: boolean;
}

export function TrustedSubmitterToggle({ email, initialValue }: TrustedSubmitterToggleProps) {
  const [checked, setChecked] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleToggle(newValue: boolean) {
    setSaving(true);
    setChecked(newValue);

    const supabase = createClient();
    const { error } = await supabase
      .from("trusted_submitters")
      .update({ auto_approve: newValue })
      .eq("email", email);

    if (error) {
      console.error("Toggle auto_approve error:", error);
      setChecked(!newValue); // revert
    }

    setSaving(false);
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleToggle}
      disabled={saving}
    />
  );
}
