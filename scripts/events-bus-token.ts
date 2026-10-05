/**
 * Print the events-bus key derived from CRON_SECRET, for the bus repo's
 * EVENTS_BUS_SECRET secret:
 *   npx tsx --env-file=.env.local scripts/events-bus-token.ts | gh secret set EVENTS_BUS_SECRET -R Benji-cpu/ubudian-events-bus
 * Never paste the output into chat or a file.
 */
import { eventsBusToken } from "@/lib/events-bus/auth";

const t = eventsBusToken(process.env.CRON_SECRET);
if (!t) {
  console.error("CRON_SECRET missing");
  process.exit(1);
}
process.stdout.write(t);
