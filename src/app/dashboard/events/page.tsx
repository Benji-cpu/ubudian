import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { DashboardEventsTabs } from "./dashboard-events-tabs";
import type { Event } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Events | The Ubudian",
};

export default async function DashboardEventsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch submitted events and saved events in parallel
  const [submittedRes, savedRes] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("submitted_by_email", profile.email)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_events")
      .select("event_id, events(*)")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const submittedEvents = (submittedRes.data ?? []) as Event[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedEvents = (savedRes.data ?? []).map(
    (row: any) => row.events as Event
  ).filter(Boolean) as Event[];

  return (
    <DashboardEventsTabs
      submittedEvents={submittedEvents}
      savedEvents={savedEvents}
      profileId={profile.id}
    />
  );
}
