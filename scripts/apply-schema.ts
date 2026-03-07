/**
 * Prepares the full database schema SQL and copies it to clipboard.
 * Then open your Supabase SQL Editor and paste + run.
 *
 * Usage:
 *   npx tsx scripts/apply-schema.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const additionalColumns = `
-- ============================================
-- ADDITIONAL COLUMNS (post-initial schema)
-- ============================================

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS archetype_tags TEXT[] DEFAULT '{}';

ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS archetype_tags TEXT[] DEFAULT '{}';

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS archetype_tags TEXT[] DEFAULT '{}';

ALTER TABLE tours ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS archetype_tags TEXT[] DEFAULT '{}';

ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS archetype TEXT;
`;

const schemaPath = join(process.cwd(), "supabase", "schema.sql");
const schemaSql = readFileSync(schemaPath, "utf-8");
const fullSql = schemaSql + "\n\n" + additionalColumns;

// Copy to clipboard on macOS
try {
  execSync("pbcopy", { input: fullSql });
  console.log("Full schema SQL copied to clipboard!\n");
} catch {
  console.log("Could not copy to clipboard. SQL printed below.\n");
  console.log(fullSql);
}

// Extract project ref for dashboard link
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (match) {
  console.log(`Open your Supabase SQL Editor:`);
  console.log(`  https://supabase.com/dashboard/project/${match[1]}/sql/new\n`);
}

console.log("Steps:");
console.log("  1. Open the link above");
console.log("  2. Paste (Cmd+V) the SQL into the editor");
console.log("  3. Click 'Run'");
console.log("  4. Then re-run: npx tsx scripts/seed-blog-posts.ts");
