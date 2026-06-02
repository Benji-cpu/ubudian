/**
 * Embeddings-first taxonomy discovery.
 *
 * Reads every embedded event, runs cosine k-means over the 768-dim vectors, and
 * prints a human-readable report: per-cluster size, category + archetype_tag
 * histograms, and the titles nearest each centroid. The point is to SEE the
 * natural groupings before hand-authoring a "vibe" vocabulary or touching the
 * quiz — the clusters tell us what facets actually exist in the corpus, and how
 * cleanly the five archetypes map onto them.
 *
 * Embeddings are L2-normalised, so Euclidean k-means == cosine k-means here.
 *
 * Usage:
 *   npx tsx scripts/cluster-events.ts                 # sweep k, detail at k=8
 *   npx tsx scripts/cluster-events.ts --k 10          # detail at a chosen k
 *   npx tsx scripts/cluster-events.ts --status approved   # cluster only approved
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface Row {
  id: string;
  title: string;
  category: string | null;
  archetype_tags: string[] | null;
  vec: number[];
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let k = 8;
  let status: string[] = ["approved", "archived"];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--k" && argv[i + 1]) k = parseInt(argv[++i], 10);
    else if (argv[i] === "--status" && argv[i + 1]) status = [argv[++i]];
  }
  return { k, status };
}

async function load(status: string[]): Promise<Row[]> {
  // Page through — Supabase caps at 1000/req but we may have hundreds.
  const rows: Row[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, category, archetype_tags, embedding")
      .in("status", status)
      .not("embedding", "is", null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data as Array<Record<string, unknown>>) {
      const raw = r.embedding;
      const vec = typeof raw === "string" ? (JSON.parse(raw) as number[]) : (raw as number[]);
      if (Array.isArray(vec) && vec.length > 0) {
        rows.push({
          id: r.id as string,
          title: r.title as string,
          category: (r.category as string) ?? null,
          archetype_tags: (r.archetype_tags as string[]) ?? [],
          vec,
        });
      }
    }
    if (data.length < pageSize) break;
  }
  return rows;
}

function dist2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

// Deterministic PRNG so repeated runs are stable (no Math.random churn).
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function kmeans(rows: Row[], k: number, iters = 30, seed = 42) {
  const rand = mulberry32(seed);
  const dim = rows[0].vec.length;
  // k-means++ init
  const centroids: number[][] = [];
  centroids.push(rows[Math.floor(rand() * rows.length)].vec.slice());
  while (centroids.length < k) {
    const d2 = rows.map((r) => Math.min(...centroids.map((c) => dist2(r.vec, c))));
    const sum = d2.reduce((a, b) => a + b, 0) || 1;
    let target = rand() * sum;
    let idx = 0;
    for (let i = 0; i < rows.length; i++) {
      target -= d2[i];
      if (target <= 0) { idx = i; break; }
    }
    centroids.push(rows[idx].vec.slice());
  }

  const assign = new Array(rows.length).fill(0);
  for (let it = 0; it < iters; it++) {
    let moved = false;
    for (let i = 0; i < rows.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist2(rows[i].vec, centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assign[i] !== best) { assign[i] = best; moved = true; }
    }
    const sums = Array.from({ length: k }, () => new Float64Array(dim));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < rows.length; i++) {
      const a = assign[i];
      counts[a]++;
      const v = rows[i].vec;
      for (let d = 0; d < dim; d++) sums[a][d] += v[d];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c];
    }
    if (!moved && it > 0) break;
  }

  let inertia = 0;
  for (let i = 0; i < rows.length; i++) inertia += dist2(rows[i].vec, centroids[assign[i]]);
  return { assign, centroids, inertia };
}

function histogram(items: string[]): string {
  const m = new Map<string, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join("  ");
}

async function main() {
  const { k, status } = parseArgs();
  console.log(`Loading embedded events (status: ${status.join("/")})…`);
  const rows = await load(status);
  console.log(`Loaded ${rows.length} embedded events.\n`);
  if (rows.length < k) {
    console.log(`Not enough rows (${rows.length}) for k=${k}.`);
    return;
  }

  console.log("Inertia sweep (lower = tighter; look for the elbow):");
  for (let kk = 5; kk <= 12; kk++) {
    const { inertia } = kmeans(rows, kk);
    console.log(`  k=${String(kk).padStart(2)}  inertia=${inertia.toFixed(1)}`);
  }

  console.log(`\n=== Detailed clusters at k=${k} ===`);
  const { assign, centroids } = kmeans(rows, k);
  for (let c = 0; c < k; c++) {
    const members = rows.filter((_, i) => assign[i] === c);
    if (members.length === 0) { console.log(`\n— Cluster ${c}: (empty)`); continue; }
    const nearest = members
      .map((m) => ({ m, d: dist2(m.vec, centroids[c]) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 12)
      .map((x) => x.m);
    console.log(`\n— Cluster ${c}  (${members.length} events)`);
    console.log(`   categories:  ${histogram(members.map((m) => m.category ?? "—"))}`);
    console.log(`   archetypes:  ${histogram(members.flatMap((m) => m.archetype_tags ?? []))}`);
    console.log(`   nearest titles:`);
    for (const m of nearest) console.log(`     · ${m.title.slice(0, 80)}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
