/**
 * Regenerate `supabase/schema.sql` from the live database — read-only.
 *
 *   npx tsx --env-file=.env.local scripts/dump-schema.ts
 *
 * Produces CREATE TABLE statements (columns, types, defaults, nullability,
 * primary keys) plus a listing of RLS policies and functions by name. It is a
 * reference snapshot for reading, not a restore script: the migrations in
 * `supabase/migrations/` remain the source of truth. The hand-written
 * schema.sql this replaces had stopped at 25 of 46 tables.
 */
import { readFileSync, writeFileSync } from "fs";
import pg from "pg";

async function main() {
  const url = new URL(readFileSync("supabase/.temp/pooler-url", "utf8").trim());
  const client = new pg.Client({
    host: url.hostname, port: Number(url.port) || 5432, database: url.pathname.slice(1),
    user: decodeURIComponent(url.username), password: process.env.SUPABASE_DB_PASSWORD, ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const tables = (await client.query(
    `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1`,
  )).rows.map((r) => r.table_name as string);
  const out: string[] = [
    "-- The Ubudian — public schema snapshot.",
    `-- Generated ${new Date().toISOString().slice(0, 10)} by scripts/dump-schema.ts from the live database.`,
    "-- Reference only: supabase/migrations/ is the source of truth. Do not hand-edit; regenerate.",
    "",
  ];
  for (const t of tables) {
    const cols = (await client.query(
      `select column_name, data_type, udt_name, character_maximum_length, is_nullable, column_default
       from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`, [t])).rows;
    const pk = (await client.query(
      `select a.attname from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
       where i.indrelid=('public.'||quote_ident($1))::regclass and i.indisprimary`, [t])).rows.map((r) => r.attname);
    const lines = cols.map((c) => {
      const type = c.data_type === "ARRAY" ? `${c.udt_name.replace(/^_/, "")}[]`
        : c.data_type === "USER-DEFINED" ? c.udt_name
        : c.character_maximum_length ? `${c.data_type}(${c.character_maximum_length})` : c.data_type;
      return `  ${c.column_name} ${type}${c.is_nullable === "NO" ? " NOT NULL" : ""}${c.column_default ? ` DEFAULT ${c.column_default}` : ""}`;
    });
    if (pk.length) lines.push(`  PRIMARY KEY (${pk.join(", ")})`);
    out.push(`CREATE TABLE ${t} (\n${lines.join(",\n")}\n);\n`);
  }
  const policies = (await client.query(
    `select tablename, policyname, cmd, roles from pg_policies where schemaname='public' order by 1,2`)).rows;
  out.push(`-- RLS policies (${policies.length}); bodies live in the migrations.`);
  for (const p of policies) out.push(`--   ${p.tablename}: ${p.policyname} [${p.cmd}] ${p.roles}`);
  const fns = (await client.query(
    `select p.proname, pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' order by 1`)).rows;
  out.push("", `-- Functions (${fns.length})`);
  for (const f of fns) out.push(`--   ${f.proname}(${f.args})`);
  writeFileSync("supabase/schema.sql", out.join("\n") + "\n");
  console.log(`schema.sql: ${tables.length} tables, ${policies.length} policies, ${fns.length} functions`);
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
