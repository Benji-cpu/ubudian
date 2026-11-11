import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EVENT_COLUMNS } from "./columns";

/** Column names of `events` in the generated schema snapshot. */
function schemaEventColumns(): string[] {
  const sql = readFileSync(join(process.cwd(), "supabase/schema.sql"), "utf8");
  const table = sql.match(/CREATE TABLE events \(([\s\S]*?)\n\);/);
  if (!table) throw new Error("events table not found in supabase/schema.sql");
  return table[1]
    .split("\n")
    .map((line) => line.trim().split(/\s+/)[0])
    .filter((name) => name && name !== "PRIMARY");
}

describe("EVENT_COLUMNS", () => {
  const listed = EVENT_COLUMNS.split(", ");

  it("never selects the embedding", () => {
    expect(listed).not.toContain("embedding");
  });

  it("lists every other column of events, and only real ones", () => {
    const real = schemaEventColumns().filter((c) => c !== "embedding");
    expect([...listed].sort()).toEqual([...real].sort());
  });
});
