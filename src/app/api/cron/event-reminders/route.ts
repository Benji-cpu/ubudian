import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { findDueReminders, type SaveRow } from "@/lib/reminders/find-due";
import { buildEventReminderEmailHtml } from "@/lib/email/event-reminder-email";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { sendTransactionalEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";
import type { Event } from "@/types";

export const maxDuration = 60;

/**
 * Saved-event reminders — runs daily via GitHub Actions (NOT Vercel cron;
 * both Hobby slots are taken). Finds saved events whose next occurrence is
 * tomorrow in Bali time and emails the saver once. Idempotent: a
 * transactional_sends row is inserted (unique dedupe_key) BEFORE sending,
 * so retries and manual dispatches never double-send.
 *
 * Test param: ?only=<email> restricts sends to that address.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const only = url.searchParams.get("only")?.toLowerCase().trim() || null;

  const bali = nowInBali();
  const [y, m, d] = bali.dateStr.split("-").map(Number);
  const tomorrow = addDays(new Date(y, m - 1, d), 1);
  const targetYmd = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const supabase = createAdminClient();

  const { data: saves, error } = await supabase
    .from("saved_events")
    .select(
      "profile_id, profiles(email, email_opt_out), events(id, slug, title, status, start_date, end_date, start_time, end_time, is_recurring, recurrence_rule, venue_name, short_description, cover_image_url)"
    );

  if (error) {
    console.error("[event-reminders] fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  type JoinedRow = {
    profile_id: string;
    profiles: { email: string | null; email_opt_out: boolean } | null;
    events: (Event & { status: string }) | null;
  };

  const rows: SaveRow[] = [];
  const eventsById = new Map<string, Event>();
  for (const raw of (saves ?? []) as unknown as JoinedRow[]) {
    if (!raw.events || !raw.profiles) continue;
    eventsById.set(raw.events.id, raw.events);
    rows.push({
      profileId: raw.profile_id,
      email: raw.profiles.email,
      emailOptOut: raw.profiles.email_opt_out,
      event: {
        id: raw.events.id,
        status: raw.events.status,
        start_date: raw.events.start_date,
        end_date: raw.events.end_date ?? null,
        is_recurring: !!raw.events.is_recurring,
        recurrence_rule: raw.events.recurrence_rule ?? null,
      },
    });
  }

  const due = findDueReminders(rows, targetYmd).filter(
    (r) => !only || r.email.toLowerCase() === only
  );

  let sent = 0;
  let skippedDuplicate = 0;
  let failed = 0;

  for (const reminder of due) {
    // Ledger first — a unique-violation means this reminder already went out.
    const { error: ledgerError } = await supabase.from("transactional_sends").insert({
      kind: "reminder",
      email: reminder.email,
      dedupe_key: reminder.dedupeKey,
    });
    if (ledgerError) {
      if (ledgerError.code === "23505") {
        skippedDuplicate++;
      } else {
        console.error("[event-reminders] ledger insert failed:", ledgerError);
        failed++;
      }
      continue;
    }

    const event = eventsById.get(reminder.eventId)!;
    const html = buildEventReminderEmailHtml({
      event,
      occurrenceDate: reminder.occurrenceDate,
      siteUrl: SITE_URL,
      unsubUrl: unsubscribeUrl(reminder.email, SITE_URL),
    });
    const ok = await sendTransactionalEmail(
      reminder.email,
      `Tomorrow: ${event.title}`,
      html
    );
    if (ok) {
      sent++;
    } else {
      failed++;
      // Roll the ledger row back so the next run retries this reminder.
      await supabase.from("transactional_sends").delete().eq("dedupe_key", reminder.dedupeKey);
    }
  }

  console.log(
    `[event-reminders] target=${targetYmd} due=${due.length} sent=${sent} dup=${skippedDuplicate} failed=${failed}`
  );
  return NextResponse.json({
    data: { target_date: targetYmd, due: due.length, sent, skipped_duplicate: skippedDuplicate, failed },
    error: null,
  });
}
