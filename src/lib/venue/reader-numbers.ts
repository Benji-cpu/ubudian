/**
 * The numbers on /for-venues, counted from the database on every page load.
 * Venues ask "how many readers do you have?"; this answers with what the
 * tables hold, never a rounded or hand-typed figure. Any count that can't be
 * read in full comes back null, and the page leaves that line out rather
 * than show a wrong number.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { isTestAddress } from "@/lib/email/digest-recipients";
import { venueSlug } from "@/lib/specials/deal-page";
import { readLiveSpecials } from "@/lib/specials/queries";

/** The window for "readers who tapped through". */
export const READER_WINDOW_DAYS = 60;

export interface ReaderNumbers {
  /** Active subscribers to the weekly email; test addresses and opted-out profiles not counted. */
  subscribers: number | null;
  /** Live deals and the places offering them. */
  deals: { deals: number; places: number } | null;
  /** Different readers (one per phone or computer) who tapped an event's ticket or organiser link, or "I'm interested". */
  readers: number | null;
  /** When the counts were read. */
  countedAt: string;
}

const norm = (e: string) => e.toLowerCase().trim();

/** Active subscribers who really get the email: no test or placeholder addresses, no one who opted out on their profile. */
export function countSubscribers(rows: { email: string | null; status: string | null }[], optedOut: string[]): number {
  const stopped = new Set(optedOut.map(norm));
  const counted = new Set<string>();
  for (const r of rows) {
    if (r.status !== "active" || !r.email) continue;
    const email = norm(r.email);
    if (isTestAddress(email) || stopped.has(email)) continue;
    counted.add(email);
  }
  return counted.size;
}

/** Each reader once, however many taps. */
export function countReaders(rows: { anon_id: string | null }[]): number {
  return new Set(rows.map((r) => r.anon_id).filter(Boolean)).size;
}

export function countDeals(deals: { venue_name: string }[]): { deals: number; places: number } {
  return { deals: deals.length, places: new Set(deals.map((d) => venueSlug(d.venue_name))).size };
}

const PAGE = 1000;
const MAX_PAGES = 50;

/** Every row a query matches, a page at a time; null on an error or if there are more than we can page through. */
async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[] | null> {
  const out: T[] = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data, error } = await page(i * PAGE, i * PAGE + PAGE - 1);
    if (error || !data) {
      if (error) console.error("reader-numbers:", error.message);
      return null;
    }
    out.push(...data);
    if (data.length < PAGE) return out;
  }
  return null;
}

async function subscribers(): Promise<number | null> {
  const supabase = createAdminClient();
  const [subs, optedOut] = await Promise.all([
    readAll<{ email: string | null; status: string | null }>((from, to) =>
      supabase.from("newsletter_subscribers").select("email, status").eq("status", "active").order("id").range(from, to)
    ),
    readAll<{ email: string | null }>((from, to) =>
      supabase.from("profiles").select("email").eq("email_opt_out", true).order("id").range(from, to)
    ),
  ]);
  if (!subs || !optedOut) return null;
  return countSubscribers(subs, optedOut.map((p) => p.email ?? "").filter(Boolean));
}

async function readers(now: Date): Promise<number | null> {
  const supabase = createAdminClient();
  const since = new Date(now.getTime() - READER_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const rows = await readAll<{ anon_id: string | null }>((from, to) =>
    supabase
      .from("event_signals")
      .select("anon_id")
      .in("kind", ["interest", "ticket_click"])
      .gte("created_at", since)
      .order("id")
      .range(from, to)
  );
  return rows ? countReaders(rows) : null;
}

async function deals(): Promise<{ deals: number; places: number } | null> {
  const live = await readLiveSpecials();
  return live ? countDeals(live) : null;
}

const orNull = <T,>(p: Promise<T | null>) => p.catch((e: unknown) => (console.error("reader-numbers:", e), null));

export async function getReaderNumbers(now: Date = new Date()): Promise<ReaderNumbers> {
  const [s, d, r] = await Promise.all([orNull(subscribers()), orNull(deals()), orNull(readers(now))]);
  return { subscribers: s, deals: d, readers: r, countedAt: now.toISOString() };
}
