import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { SettingsForm } from "@/components/dashboard/settings-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | The Ubudian",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Check newsletter subscription status
  const { data: subscriber } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", profile.email ?? "")
    .eq("status", "active")
    .maybeSingle();

  const isSubscribed = !!subscriber;

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium">Settings</h1>
      <div className="mt-6">
        <SettingsForm profile={profile} isSubscribed={isSubscribed} />
      </div>
    </div>
  );
}
