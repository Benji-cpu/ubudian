/**
 * One-shot trigger of a single ingestion source against prod DB. Reuses the same
 * runIngestion() the admin "Run now" button calls, but bypasses Vercel's 10s
 * Hobby timeout and admin-session auth.
 *
 * Usage:
 *   npx tsx scripts/run-source-once.ts <slug-or-id>
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * GEMINI_API_KEY, and whatever the adapter needs (e.g. APIFY_API_TOKEN).
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "@/lib/supabase/admin";
import { runIngestion } from "@/lib/ingestion";
import "@/lib/ingestion/adapters";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/run-source-once.ts <slug-or-id>");
    process.exit(1);
  }

  const supabase = createAdminClient();
  const isUuid = /^[0-9a-f-]{36}$/i.test(arg);
  const query = isUuid
    ? supabase.from("event_sources").select("id, slug, name").eq("id", arg).single()
    : supabase.from("event_sources").select("id, slug, name").eq("slug", arg).single();
  const { data: source, error } = await query;
  if (error || !source) {
    console.error("Source lookup failed:", error?.message ?? "not found");
    process.exit(2);
  }

  console.log(`Running ingestion for ${source.name} (${source.slug}) [${source.id}]`);
  const t0 = Date.now();
  const result = await runIngestion(source.id);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n--- DONE in ${elapsed}s ---`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(99);
});
