/**
 * Run the autonomous editorial gate against the live database.
 *
 *   npx tsx scripts/auto-approve.ts                 # dry run, 25 events
 *   npx tsx scripts/auto-approve.ts --limit=250     # dry run, whole backlog
 *   npx tsx scripts/auto-approve.ts --limit=250 --apply
 *
 * **Dry run is the default.** Nothing is written unless you pass `--apply`.
 *
 * The nightly cron does the same work with the module's own defaults
 * (25 events, 25s budget). This script exists for two jobs: sanity-checking
 * the screening rules after you change them, and the one-time drain of a
 * backlog that accumulated while nothing was publishing.
 *
 * The dry-run half is also reachable in production as
 * `GET /api/cron/daily-maintenance?dryRun=true` with the CRON_SECRET bearer.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { autoApprovePending } from "../src/lib/maintenance/auto-approve";

function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split("=")[1];
}

async function main() {
  const apply = process.argv.includes("--apply");
  const limit = Number(flag("limit")) || 25;
  // A CLI run isn't sharing a 60s Lambda with the link-health sweep, so it can
  // afford a much longer budget than the cron default.
  const maxElapsedMs = Number(flag("budget")) || 10 * 60 * 1000;

  console.log(
    apply
      ? `APPLYING — publishing up to ${limit} events\n`
      : `Dry run (nothing will be written), limit ${limit}. Pass --apply to publish.\n`,
  );

  const result = await autoApprovePending({ dryRun: !apply, limit, maxElapsedMs });

  const approved = result.decisions.filter((d) => d.verdict === "approved");
  const rejected = result.decisions.filter((d) => d.verdict === "rejected");

  console.log(`${apply ? "APPROVED" : "WOULD APPROVE"} (${result.approved})`);
  for (const d of approved) {
    console.log(`  ${d.startDate}  ${d.recurring ? "↻" : " "}  [${d.category}]  ${d.title}`);
  }
  if (result.approved > approved.length) {
    console.log(`  … and ${result.approved - approved.length} more (report list is truncated)`);
  }

  if (result.rejected > 0) {
    console.log(`\n${apply ? "REJECTED" : "WOULD REJECT"} (${result.rejected})`);
    for (const d of rejected) {
      console.log(`  ${d.startDate}  ${d.title}\n      ${d.reason}`);
    }
  }

  // Which rule is doing the work. `heldReasons` is a complete tally — the
  // `decisions` list above is truncated, so don't count from it.
  console.log(`\nHELD (${result.held}) by reason:`);
  for (const [reason, count] of Object.entries(result.heldReasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${reason}`);
  }

  console.log(
    `\nscanned=${result.scanned} approved=${result.approved} rejected=${result.rejected} held=${result.held}`,
  );
  if (result.errors.length) console.log("errors:", result.errors);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
