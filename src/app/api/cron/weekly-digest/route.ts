import { NextResponse } from "next/server";
import { addDays, getISOWeek, getISOWeekYear } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { filterEventsInRange } from "@/lib/events/filter-range";
import { buildSpread } from "@/lib/quiz/build-spread";
import { buildWeeklyDigestEmailHtml } from "@/lib/email/weekly-digest-email";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { sendTransactionalEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import type { ArchetypeId, Event } from "@/types";

export const maxDuration = 60;

/**
 * Weekly For-You digest — runs Wednesday mornings (Bali) via GitHub Actions
 * (NOT Vercel cron; both Hobby slots are taken). Recipients: profiles with an
 * email and either a quiz archetype or at least one saved event, minus
 * opt-outs. Each gets up to 5 events from the next 7 Bali days — spread-
 * matched to their archetype when they have one, the top of the window
 * otherwise. Idempotent per ISO week via transactional_sends.
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
  const today = new Date(y, m - 1, d);
  const toStr = ymd(addDays(today, 6));
  const weekKey = `${getISOWeekYear(today)}-W${String(getISOWeek(today)).padStart(2, "0")}`;
  const weekLabel = `Week of ${today.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;

  const supabase = createAdminClient();

  const [profilesRes, savesRes, eventsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, email_opt_out, primary_archetype")
      .not("email", "is", null)
      .eq("email_opt_out", false),
    supabase.from("saved_events").select("profile_id"),
    supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .or(`start_date.gte.${bali.dateStr},is_recurring.eq.true`),
  ]);

  if (profilesRes.error || savesRes.error || eventsRes.error) {
    console.error("[weekly-digest] fetch failed:", profilesRes.error ?? savesRes.error ?? eventsRes.error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const saverIds = new Set((savesRes.data ?? []).map((s) => s.profile_id as string));

  // Events occurring in the next 7 Bali days, recurring rolled forward.
  const weekEvents = filterEventsInRange(
    (eventsRes.data ?? []) as Event[],
    bali.dateStr,
    toStr
  );

  type ProfileRow = {
    id: string;
    email: string;
    email_opt_out: boolean;
    primary_archetype: string | null;
  };

  const recipients = ((profilesRes.data ?? []) as ProfileRow[])
    .filter((p) => p.email && (p.primary_archetype || saverIds.has(p.id)))
    .filter((p) => !only || p.email.toLowerCase() === only);

  let sent = 0;
  let skippedDuplicate = 0;
  let skippedEmpty = 0;
  let failed = 0;

  for (const profile of recipients) {
    const archetype: ArchetypeId | null = ARCHETYPE_IDS.includes(
      profile.primary_archetype as ArchetypeId
    )
      ? (profile.primary_archetype as ArchetypeId)
      : null;

    const picks = archetype
      ? buildSpread(archetype, weekEvents, [], { eventLimit: 5 }).events
      : weekEvents.slice(0, 5);

    if (picks.length === 0) {
      skippedEmpty++;
      continue;
    }

    const dedupeKey = `digest:${profile.id}:${weekKey}`;
    const { error: ledgerError } = await supabase.from("transactional_sends").insert({
      kind: "digest",
      email: profile.email,
      dedupe_key: dedupeKey,
    });
    if (ledgerError) {
      if (ledgerError.code === "23505") skippedDuplicate++;
      else {
        console.error("[weekly-digest] ledger insert failed:", ledgerError);
        failed++;
      }
      continue;
    }

    const html = buildWeeklyDigestEmailHtml({
      archetype,
      events: picks,
      siteUrl: SITE_URL,
      unsubUrl: unsubscribeUrl(profile.email, SITE_URL),
      weekLabel,
    });
    const ok = await sendTransactionalEmail(
      profile.email,
      "This week in your Ubud",
      html
    );
    if (ok) {
      sent++;
    } else {
      failed++;
      await supabase.from("transactional_sends").delete().eq("dedupe_key", dedupeKey);
    }
  }

  console.log(
    `[weekly-digest] week=${weekKey} recipients=${recipients.length} sent=${sent} dup=${skippedDuplicate} empty=${skippedEmpty} failed=${failed}`
  );
  return NextResponse.json({
    data: {
      week: weekKey,
      recipients: recipients.length,
      sent,
      skipped_duplicate: skippedDuplicate,
      skipped_empty: skippedEmpty,
      failed,
    },
    error: null,
  });
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
