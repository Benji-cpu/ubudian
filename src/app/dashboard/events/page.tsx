import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getOrCreateIcsToken } from "@/lib/events/ics-token";
import { SITE_URL } from "@/lib/constants";
import { DashboardEventsTabs } from "./dashboard-events-tabs";
import { stripEmbeddings } from "@/lib/events/strip-embedding";
import type { Event } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Agenda",
};

export default async function DashboardEventsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.email) redirect("/login");
  const profileEmail = profile.email;

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch submitted events + saved upcoming events + ICS token in parallel
  const [submittedRes, savedRes, icsToken, trustedRes] = await Promise.all([
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
    supabase
      .from("trusted_submitters")
      .select("auto_approve")
      .eq("email", profileEmail.toLowerCase())
      .maybeSingle(),
  ]);

  const submittedEvents = stripEmbeddings((submittedRes.data ?? []) as Event[]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedAll = stripEmbeddings(
    (savedRes.data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => row.events as Event)
      .filter(Boolean) as Event[]
  );

  // Upcoming, approved, sorted ascending by date then time
  const savedEvents = savedAll
    .filter((e) => e.status === "approved" && e.start_date >= today)
    .sort((a, b) => {
      if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    });

  const icsUrl = `${SITE_URL.replace(/\/$/, "")}/api/events/ics?token=${icsToken}`;

  const publishedCount = submittedEvents.filter((e) => e.status === "approved").length;
  const organizer =
    submittedEvents.length > 0
      ? {
          publishedCount,
          isTrusted:
            (trustedRes.data as { auto_approve: boolean } | null)?.auto_approve ?? false,
        }
      : null;

  return (
    <DashboardEventsTabs
      submittedEvents={submittedEvents}
      savedEvents={savedEvents}
      profileId={profile.id}
      icsUrl={icsUrl}
      organizer={organizer}
    />
  );
}
