/**
 * Convert every non-JSON recurrence rule to the canonical JSON form, using the
 * same normaliser the pipeline applies on insert.
 *
 *   npx tsx --env-file=.env.local scripts/normalize-recurrence.ts          # report
 *   npx tsx --env-file=.env.local scripts/normalize-recurrence.ts --apply  # write
 *
 * Step 4 of migration 20260915090000_recurrence_until.sql.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRecurrenceRule } from "@/lib/recurrence";

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, status, start_date, end_date, recurrence_rule")
    .eq("is_recurring", true)
    .not("recurrence_rule", "like", "{%");
  if (error) throw error;
  const rows = (data ?? []) as { id: string; title: string; status: string; end_date: string | null; recurrence_rule: string | null }[];
  console.log(`${rows.length} recurring rows with a non-JSON rule`);
  let converted = 0, demoted = 0;
  for (const row of rows) {
    const rule = normalizeRecurrenceRule(row.recurrence_rule, row.end_date);
    const patch = rule ? { recurrence_rule: rule, end_date: null } : { is_recurring: false, recurrence_rule: null };
    console.log(`${row.status.padEnd(9)} ${JSON.stringify(row.recurrence_rule).padEnd(45)} → ${rule ?? "ONE-OFF"}  ${row.title.slice(0, 40)}`);
    if (rule) converted += 1; else demoted += 1;
    if (apply) {
      const { error: upd } = await supabase.from("events").update(patch).eq("id", row.id);
      if (upd) throw upd;
    }
  }
  console.log(`${apply ? "applied" : "would apply"}: ${converted} converted, ${demoted} demoted to one-off`);
}
main().catch((e) => { console.error(e); process.exit(1); });
