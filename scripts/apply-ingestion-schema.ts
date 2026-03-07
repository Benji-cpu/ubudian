/**
 * Prepares the ingestion schema migration SQL and copies it to clipboard.
 * Then open your Supabase SQL Editor and paste + run.
 *
 * Usage:
 *   npx tsx scripts/apply-ingestion-schema.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260303_ingestion_schema.sql"
);

const sql = readFileSync(migrationPath, "utf-8");

// Copy to clipboard on macOS
try {
  execSync("pbcopy", { input: sql });
  console.log("Ingestion schema SQL copied to clipboard!\n");
} catch {
  console.log("Could not copy to clipboard. SQL printed below.\n");
  console.log(sql);
}

// Extract project ref for dashboard link
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (match) {
  console.log(`Open your Supabase SQL Editor:`);
  console.log(
    `  https://supabase.com/dashboard/project/${match[1]}/sql/new\n`
  );
}

console.log("Steps:");
console.log("  1. Open the link above");
console.log("  2. Paste (Cmd+V) the SQL into the editor");
console.log("  3. Click 'Run'");
console.log(
  "  4. Then run: npm run telegram:setup to create the event source"
);
