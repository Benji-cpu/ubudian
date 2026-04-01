"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, LogOut } from "lucide-react";
import type { Profile } from "@/types";

const settingsSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or less"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  profile: Profile;
  isSubscribed: boolean;
}

export function SettingsForm({ profile, isSubscribed }: SettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      display_name: profile.display_name || "",
    },
  });

  async function onSubmit(values: SettingsFormValues) {
    setSaving(true);
    setSuccess(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: values.display_name })
      .eq("id", profile.id);

    setSaving(false);

    if (!error) {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-xl font-medium">Profile</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 max-w-md space-y-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              {success && (
                <span className="text-sm text-green-600">Saved!</span>
              )}
            </div>
          </form>
        </Form>
      </div>

      <div className="border-t border-brand-gold/10 pt-6">
        <h2 className="font-serif text-xl font-medium">Newsletter</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSubscribed
            ? "You're getting the weekly Ubudian — one email, every week."
            : "You're not subscribed yet — you're missing the weekly roundup."}
        </p>
      </div>

      <div className="border-t border-brand-gold/10 pt-6">
        <h2 className="font-serif text-xl font-medium">Account</h2>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="mt-4"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
