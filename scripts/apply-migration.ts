/**
 * Apply ONE migration file to the linked Supabase project and record it in
 * `supabase_migrations.schema_migrations`.
 *
 *   npx tsx --env-file=.env.local scripts/apply-migration.ts supabase/migrations/<file>.sql
 *   npx tsx --env-file=.env.local scripts/apply-migration.ts <file> --dry-run   # print statements only
 *
 * Why this exists: `supabase db push` is unsafe here (the CLI's migration
 * history is ~50 files out of step with the remote) and there is no psql on
 * the machine. MEMORY.md documented the manual method — a pg client against
 * `supabase/.temp/pooler-url` with `SUPABASE_DB_PASSWORD`, then insert the
 * version by hand — and this is that method as a script. Statements run one
 * at a time inside a single transaction; each one's row count is printed so
 * the result is read back, not assumed.
 */
import { readFileSync } from "fs";
import { basename } from "path";
import pg from "pg";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: apply-migration.ts <migration.sql> [--dry-run]");
  const dryRun = process.argv.includes("--dry-run");
  const version = basename(file).match(/^(\d{14})/)?.[1];
  if (!version) throw new Error("migration filename must start with a 14-digit timestamp");

  const sql = readFileSync(file, "utf8");
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter((s) => s.length > 0);
  console.log(`${basename(file)}: ${statements.length} statements${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    statements.forEach((s, i) => console.log(`\n-- [${i + 1}]\n${s};`));
    return;
  }

  const url = new URL(readFileSync("supabase/.temp/pooler-url", "utf8").trim());
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) throw new Error("SUPABASE_DB_PASSWORD missing");
  const client = new pg.Client({
    host: url.hostname,
    port: Number(url.port) || 5432,
    database: url.pathname.slice(1),
    user: decodeURIComponent(url.username),
    password,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const already = await client.query("select 1 from supabase_migrations.schema_migrations where version = $1", [version]);
    if (already.rowCount) throw new Error(`version ${version} is already recorded on the remote`);
    await client.query("begin");
    for (let i = 0; i < statements.length; i++) {
      const res = await client.query(statements[i]);
      console.log(`[${i + 1}/${statements.length}] ${res.command} ${res.rowCount ?? ""}  ${statements[i].split("\n")[0].slice(0, 70)}`);
    }
    await client.query(
      "insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)",
      [version, basename(file).replace(/^\d{14}_/, "").replace(/\.sql$/, ""), statements],
    );
    await client.query("commit");
    console.log(`recorded ${version}`);
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
