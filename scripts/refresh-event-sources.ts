/**
 * Manual refresh sweep over all source-linked upcoming events.
 *
 * Re-fetches Megatix detail for every approved upcoming event with a
 * megatix.co.id source URL, updating cover image / price / ticket URL,
 * and archiving listings that 404. Use this to flush the queue between
 * cron runs.
 *
 * Usage:
 *   npx tsx scripts/refresh-event-sources.ts                # all
 *   npx tsx scripts/refresh-event-sources.ts --dry-run
 *   npx tsx scripts/refresh-event-sources.ts --limit 10
 *   npx tsx scripts/refresh-event-sources.ts --id <eventId>
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { refreshLinkedEvents } from "@/lib/ingestion/refresher";

interface CliArgs {
  dryRun: boolean;
  limit?: number;
  id?: string;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--limit" && argv[i + 1]) {
      args.limit = parseInt(argv[++i], 10);
    } else if (argv[i] === "--id" && argv[i + 1]) {
      args.id = argv[++i];
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  console.log("[refresh] args:", args);

  const summary = await refreshLinkedEvents({
    dryRun: args.dryRun,
    limit: args.limit ?? 500,
    onlyEventId: args.id,
  });

  for (const r of summary.results) {
    const tag = r.changedFields ? ` [${r.changedFields.join(", ")}]` : "";
    const errMsg = r.error ? ` (${r.error})` : "";
    console.log(`  ${r.status.padEnd(20)} ${r.eventId} "${r.title}"${tag}${errMsg}`);
  }

  console.log(
    `\n[refresh] done. processed=${summary.processed} updated=${summary.updated} no_changes=${summary.noChanges} archived=${summary.archived} skipped=${summary.skipped} errors=${summary.errors}`
  );
}

main().catch((err) => {
  console.error("[refresh] fatal:", err);
  process.exit(1);
});
