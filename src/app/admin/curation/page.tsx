import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarkdownContent } from "@/components/content/markdown-content";
import { getWeekPicks } from "@/lib/events/picks";

export const dynamic = "force-dynamic";

/**
 * The events desk at a glance: this week's picks, what readers tapped, what
 * they suggested, and the routine's monthly reports. Read-only; the routine
 * runs everything (bus repo Benji-cpu/ubudian-events-bus).
 */
function thirtyDaysAgo(): string {
  return new Date(Date.now() - 30 * 864e5).toISOString();
}

export default async function CurationPage() {
  const supabase = createAdminClient();
  const since = thirtyDaysAgo();
  const [picks, signalsRes, suggRes, reportsRes] = await Promise.all([
    getWeekPicks(supabase),
    supabase.from("event_signals").select("event_id, kind, event:events(title, slug)").gte("created_at", since).limit(5000),
    supabase.from("source_suggestions").select("body, handles, urls, status, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("curation_reports").select("month, markdown, emailed_at").order("month", { ascending: false }).limit(6),
  ]);

  const tally = new Map<string, { title: string; slug: string; interest: number; clicks: number }>();
  for (const s of (signalsRes.data ?? []) as unknown as { event_id: string; kind: string; event: { title: string; slug: string } | null }[]) {
    if (!s.event) continue;
    const t = tally.get(s.event_id) ?? { title: s.event.title, slug: s.event.slug, interest: 0, clicks: 0 };
    if (s.kind === "interest") t.interest++;
    else t.clicks++;
    tally.set(s.event_id, t);
  }
  const top = [...tally.values()].sort((a, b) => b.interest + b.clicks - (a.interest + a.clicks)).slice(0, 15);
  const reports = reportsRes.data ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-deep-green">Curation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The events desk routine picks the week every Wednesday and reports on the 1st. Nothing here needs action.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">This week&apos;s picks ({picks.length})</h2>
        {picks.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No picks for this week yet.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
            {picks.map((p) => (
              <li key={p.event.id}>
                <Link href={`/events/${p.event.slug}`} className="font-medium underline underline-offset-2">{p.event.title}</Link>{" "}
                <span className="text-muted-foreground">({p.event.start_date}) {p.why}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Reader signals, last 30 days</h2>
        {top.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None yet.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1">Event</th><th>Interested</th><th>Link clicks</th></tr></thead>
            <tbody>
              {top.map((t) => (
                <tr key={t.slug} className="border-t">
                  <td className="py-1"><Link href={`/events/${t.slug}`} className="underline underline-offset-2">{t.title}</Link></td>
                  <td>{t.interest}</td>
                  <td>{t.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Reader suggestions</h2>
        {(suggRes.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {(suggRes.data ?? []).map((s, i) => (
              <li key={i}>
                <span className="text-muted-foreground">{s.created_at.slice(0, 10)} · {s.status} · </span>
                {s.body}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Monthly reports</h2>
        {reports.length === 0 && <p className="mt-2 text-sm text-muted-foreground">The first report comes on 1 Nov.</p>}
        {reports.map((r) => (
          <details key={r.month} open={r === reports[0]} className="mt-3 rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">{r.month}{r.emailed_at ? " · emailed" : ""}</summary>
            <div className="mt-3">
              <MarkdownContent content={r.markdown} />
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
