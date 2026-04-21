import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getOrCreateIcsToken } from "@/lib/events/ics-token";
import { SITE_URL } from "@/lib/constants";
import { DashboardEventsTabs } from "./dashboard-events-tabs";
import type { Event } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Agenda | The Ubudian",
};

export default async function DashboardEventsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch submitted events + saved upcoming events + ICS token in parallel
  const [submittedRes, savedRes, icsToken] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("submitted_by_email", profile.email)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_events")
      .select("event_id, events(*)")
      .eq("profile_id", profile.id),
    getOrCreateIcsToken(profile.id),
  ]);

  const submittedEvents = (submittedRes.data ?? []) as Event[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedAll = (savedRes.data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.events as Event)
    .filter(Boolean) as Event[];

  // Upcoming, approved, sorted ascending by date then time
  const savedEvents = savedAll
    .filter((e) => e.status === "approved" && e.start_date >= today)
    .sort((a, b) => {
      if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    });

  const icsUrl = `${SITE_URL.replace(/\/$/, "")}/api/events/ics?token=${icsToken}`;

  return (
    <DashboardEventsTabs
      submittedEvents={submittedEvents}
      savedEvents={savedEvents}
      profileId={profile.id}
      icsUrl={icsUrl}
    />
  );
}
