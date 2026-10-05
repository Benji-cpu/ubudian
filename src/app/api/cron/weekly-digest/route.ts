import { NextResponse } from "next/server";
import { addDays, getISOWeek, getISOWeekYear } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import { filterEventsInRange } from "@/lib/events/filter-range";
import { visibleListings } from "@/lib/events/listing-checks";
import { digestRecipients, type DigestProfile, type DigestSubscriber } from "@/lib/email/digest-recipients";
import { buildSpread } from "@/lib/quiz/build-spread";
import { buildWeeklyDigestEmailHtml } from "@/lib/email/weekly-digest-email";
import { issueNumberFor, pickWeeklyDeals } from "@/lib/email/weekly-deals";
import { spreadAcrossWeek } from "@/lib/email/week-spread";
import { getLiveSpecials } from "@/lib/specials/queries";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { NEWSLETTER_FROM, sendTransactionalEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import type { ArchetypeId, Event } from "@/types";

export const maxDuration = 60;

/**
 * The weekly email — runs Wednesday mornings (Bali) via GitHub Actions
 * (NOT Vercel cron; both Hobby slots are taken). It is the only newsletter:
 * there is no Beehiiv step. Recipients, one email per address:
 *   - active `newsletter_subscribers` (the footer and quiz sign-ups), and
 *   - profiles with a quiz archetype or at least one saved event,
 * minus anyone unsubscribed on either list. Each gets up to 5 events from the
 * next 7 Bali days — spread-matched to their archetype when they have one,
 * the top of the window otherwise — with an unsubscribe link and header.
 * Idempotent per address per ISO week via transactional_sends.
 *
 * Test param: ?only=<email> restricts sends to that address.
 * ?deals=1 opens the issue with this week's live deals (src/lib/email/weekly-deals.ts).
 * It stays opt-in until Ben's yes on the first deals issue to the list; the
 * scheduled workflow does not pass it yet.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const only = url.searchParams.get("only")?.toLowerCase().trim() || null;
  const includeDeals = url.searchParams.get("deals") === "1";

  const bali = nowInBali();
  const [y, m, d] = bali.dateStr.split("-").map(Number);
  const today = new Date(y, m - 1, d);
  const toStr = ymd(addDays(today, 6));
  const weekKey = `${getISOWeekYear(today)}-W${String(getISOWeek(today)).padStart(2, "0")}`;
  const weekLabel = `Week of ${today.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;

  const supabase = createAdminClient();

  const [profilesRes, subscribersRes, savesRes, eventsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, email_opt_out, primary_archetype")
      .not("email", "is", null),
    supabase.from("newsletter_subscribers").select("email, status, archetype"),
    supabase.from("saved_events").select("profile_id"),
    supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .or(`start_date.gte.${bali.dateStr},is_recurring.eq.true`),
  ]);

  const fetchError = profilesRes.error ?? subscribersRes.error ?? savesRes.error ?? eventsRes.error;
  if (fetchError) {
    console.error("[weekly-digest] fetch failed:", fetchError);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const saverIds = new Set((savesRes.data ?? []).map((s) => s.profile_id as string));

  // Events occurring in the next 7 Bali days, recurring rolled forward.
  const weekEvents = filterEventsInRange(
    visibleListings((eventsRes.data ?? []) as Event[]),
    bali.dateStr,
    toStr
  );

  const issueNumber = issueNumberFor(bali.dateStr);
  const deals = includeDeals
    ? pickWeeklyDeals(await getLiveSpecials(), bali.dayOfWeek, undefined, issueNumber)
    : [];

  const recipients = digestRecipients(
    (profilesRes.data ?? []) as DigestProfile[],
    (subscribersRes.data ?? []) as DigestSubscriber[],
    saverIds
  ).filter((r) => !only || r.email === only);

  let sent = 0;
  let skippedDuplicate = 0;
  let skippedEmpty = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const archetype: ArchetypeId | null = ARCHETYPE_IDS.includes(recipient.archetype as ArchetypeId)
      ? (recipient.archetype as ArchetypeId)
      : null;

    const picks = archetype
      ? buildSpread(archetype, weekEvents, { eventLimit: 5 }).events
      : spreadAcrossWeek(weekEvents, 5, bali.dateStr, issueNumber);

    if (picks.length === 0 && deals.length === 0) {
      skippedEmpty++;
      continue;
    }

    // A test send (?only=) never touches the ledger, so it can be repeated and
    // doesn't use up that reader's real issue for the week.
    const dedupeKey = `digest:${recipient.email}:${weekKey}`;
    const { error: ledgerError } = only
      ? { error: null }
      : await supabase.from("transactional_sends").insert({
          kind: "digest",
          email: recipient.email,
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

    const unsubUrl = unsubscribeUrl(recipient.email, SITE_URL);
    const html = buildWeeklyDigestEmailHtml({
      archetype,
      events: picks,
      siteUrl: SITE_URL,
      unsubUrl,
      weekLabel,
      deals,
    });
    const subject = deals.length > 0 ? "This week in Ubud: deals and what's on" : "This week in Ubud";
    const ok = await sendTransactionalEmail(recipient.email, subject, html, {
      unsubUrl,
      from: NEWSLETTER_FROM,
    });
    if (ok) {
      sent++;
    } else {
      failed++;
      if (!only) await supabase.from("transactional_sends").delete().eq("dedupe_key", dedupeKey);
    }
  }

  console.log(
    `[weekly-digest] week=${weekKey} recipients=${recipients.length} sent=${sent} dup=${skippedDuplicate} empty=${skippedEmpty} failed=${failed}`
  );
  return NextResponse.json({
    data: {
      week: weekKey,
      deals: deals.length,
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
