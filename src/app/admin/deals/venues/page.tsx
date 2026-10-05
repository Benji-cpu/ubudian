import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { loadPipeline, STAGES, STAGE_LABELS, type Stage } from "@/lib/deals/pipeline";

export const metadata = { title: "Deals pipeline — Admin" };
export const dynamic = "force-dynamic";

const SHOW = 200;

/** The stages Ben reads left to right; "nothing found" and "closed" sit after the funnel. */
const FUNNEL: Stage[] = ["not_checked", "special_found", "venue_confirmed", "live", "reconfirm_due"];
const OTHER: Stage[] = ["nothing_found", "closed"];

function href(params: Record<string, string | undefined>) {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
  const s = q.toString();
  return `/admin/deals/venues${s ? `?${s}` : ""}`;
}

/**
 * Every eating, drinking and wellness venue in Ubud and where each one stands,
 * so no venue and no special gets lost. Status comes from src/lib/deals/pipeline.ts.
 */
export default async function DealsPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; area?: string; q?: string }>;
}) {
  if (!(await isAdmin())) redirect("/");
  const { stage, area, q } = await searchParams;
  const p = await loadPipeline();
  const activeStage = STAGES.includes(stage as Stage) ? (stage as Stage) : undefined;
  const areas = [...new Set(p.rows.map((r) => r.area).filter((a): a is string => !!a))].sort();
  const needle = q?.trim().toLowerCase();
  const rows = p.rows
    .filter((r) => !activeStage || r.stage === activeStage)
    .filter((r) => !area || r.area === area)
    .filter((r) => !needle || r.name.toLowerCase().includes(needle))
    .sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage) || a.name.localeCompare(b.name));
  const checked = p.total - p.byStage.not_checked;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deals pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {p.total} venues · {checked} checked ({Math.round((checked / Math.max(p.total, 1)) * 100)}%) ·{" "}
          {p.checkedToday} today · {p.checkedThisWeek} this week · {p.dueNow} due a check
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {FUNNEL.map((s) => (
          <Link
            key={s}
            href={href({ stage: activeStage === s ? undefined : s, area })}
            className={`rounded-xl border p-3 ${activeStage === s ? "border-primary bg-primary/5" : "bg-card"}`}
          >
            <p className="text-2xl font-semibold tabular-nums">{p.byStage[s]}</p>
            <p className="text-xs text-muted-foreground">{STAGE_LABELS[s]}</p>
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {OTHER.map((s, i) => (
          <span key={s}>
            {i > 0 && " · "}
            <Link href={href({ stage: s, area })} className="underline underline-offset-2">
              {STAGE_LABELS[s]}: {p.byStage[s]}
            </Link>
          </span>
        ))}
        {activeStage && (
          <>
            {" · "}
            <Link href={href({ area })} className="underline underline-offset-2">
              Show all stages
            </Link>
          </>
        )}
      </p>

      <form className="flex flex-wrap gap-2" action="/admin/deals/venues">
        {activeStage && <input type="hidden" name="stage" value={activeStage} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search a venue"
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <select name="area" defaultValue={area ?? ""} className="rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button className="rounded-lg border px-3 py-2 text-sm">Filter</button>
      </form>

      <p className="text-sm text-muted-foreground">
        {rows.length} venue{rows.length === 1 ? "" : "s"}
        {rows.length > SHOW ? `, showing the first ${SHOW}` : ""}
      </p>
      <ul className="divide-y rounded-xl border bg-card">
        {rows.slice(0, SHOW).map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {[r.category, r.area, r.specials ? `${r.specials} special${r.specials === 1 ? "" : "s"} on file` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{STAGE_LABELS[r.stage]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
