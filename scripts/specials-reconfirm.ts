/**
 * Run the nightly "still running?" step by hand.
 *
 *   npx tsx --env-file=.env.local scripts/specials-reconfirm.ts            dry run: who is due
 *   npx tsx --env-file=.env.local scripts/specials-reconfirm.ts --apply    send the emails
 *
 * The nightly route (/api/cron/daily-maintenance) runs the same function.
 */
import { sendDueReconfirms } from "@/lib/specials/reconfirm";

const apply = process.argv.includes("--apply");
sendDueReconfirms({ dryRun: !apply })
  .then((r) => console.log(apply ? "sent" : "dry run", JSON.stringify(r)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
