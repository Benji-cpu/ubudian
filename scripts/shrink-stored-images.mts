/**
 * One-off: shrink the images already in the Supabase `images` bucket.
 *
 *   npx tsx --env-file=.env.local scripts/shrink-stored-images.mts            # dry run: counts and sizes only
 *   npx tsx --env-file=.env.local scripts/shrink-stored-images.mts --apply    # rewrite, newest first
 *   ... --prefix events/     only that folder
 *   ... --min-kb 200         skip files smaller than this (default 200)
 *   ... --max-mb 300         stop after downloading this much (default 300)
 *
 * Why: the site serves stored images straight from Supabase, at whatever size
 * they were stored. Originals of up to 5 MB took the project over its egress
 * quota in November 2026 (see src/lib/images/shrink.ts). New uploads are shrunk
 * on the way in; this does the same for what is already there.
 *
 * Each file is rewritten IN PLACE (same path, so no database row changes) as a
 * web-sized JPEG with a one-year cache header. The path may still end in .png;
 * browsers go by the Content-Type header, which is set to image/jpeg.
 *
 * Downloading a file costs egress once, so the run goes newest first (the
 * images on upcoming events) and stops at --max-mb. Run it again later for
 * the rest. A file that would not get at least 20% smaller is left alone.
 */
import { createClient } from "@supabase/supabase-js";
import { shrinkForWeb, STORAGE_CACHE_SECONDS } from "../src/lib/images/shrink";

const BUCKET = "images";
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const apply = flag("--apply");
const prefix = opt("--prefix", "");
const minBytes = Number(opt("--min-kb", "200")) * 1024;
const maxBytes = Number(opt("--max-mb", "300")) * 1024 * 1024;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Obj {
  path: string;
  size: number;
  mimetype: string;
  createdAt: string;
}

async function listAll(dir: string, out: Obj[]): Promise<void> {
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(dir, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list ${dir || "/"}: ${error.message || JSON.stringify(error)}`);
    if (!data?.length) return;
    for (const item of data) {
      const path = dir ? `${dir}/${item.name}` : item.name;
      if (item.id === null) {
        await listAll(path, out); // a folder
      } else {
        out.push({
          path,
          size: Number(item.metadata?.size ?? 0),
          mimetype: String(item.metadata?.mimetype ?? ""),
          createdAt: item.created_at ?? "",
        });
      }
    }
    if (data.length < 1000) return;
  }
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + " MB";

async function main() {
  const all: Obj[] = [];
  await listAll(prefix.replace(/\/$/, ""), all);
  const total = all.reduce((s, o) => s + o.size, 0);
  const candidates = all
    .filter((o) => o.size >= minBytes && o.mimetype !== "image/gif" && o.mimetype.startsWith("image/"))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const candidateBytes = candidates.reduce((s, o) => s + o.size, 0);

  console.log(`bucket ${BUCKET}${prefix ? " /" + prefix : ""}: ${all.length} files, ${mb(total)}`);
  console.log(`over ${minBytes / 1024} KB and not GIF: ${candidates.length} files, ${mb(candidateBytes)}`);
  const byFolder = new Map<string, { n: number; bytes: number }>();
  for (const o of all) {
    const f = o.path.split("/")[0];
    const e = byFolder.get(f) ?? { n: 0, bytes: 0 };
    e.n++;
    e.bytes += o.size;
    byFolder.set(f, e);
  }
  for (const [f, e] of [...byFolder].sort((a, b) => b[1].bytes - a[1].bytes)) {
    console.log(`  ${f}: ${e.n} files, ${mb(e.bytes)}`);
  }
  if (!apply) {
    console.log(`dry run: nothing changed. --apply rewrites up to ${mb(maxBytes)} of downloads, newest first.`);
    return;
  }

  let downloaded = 0;
  let before = 0;
  let after = 0;
  let rewritten = 0;
  let skipped = 0;
  let failed = 0;
  for (const o of candidates) {
    if (downloaded + o.size > maxBytes) {
      console.log(`stopped at the ${mb(maxBytes)} download limit; run again for the rest.`);
      break;
    }
    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(o.path);
    if (dlErr || !blob) {
      failed++;
      console.log(`  download failed: ${o.path}`);
      continue;
    }
    downloaded += o.size;
    const input = new Uint8Array(await blob.arrayBuffer());
    const shrunk = await shrinkForWeb(input, o.mimetype);
    if (shrunk.bytes === input || shrunk.bytes.byteLength > input.byteLength * 0.8) {
      skipped++;
      continue;
    }
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(o.path, shrunk.bytes, {
      contentType: shrunk.contentType,
      cacheControl: STORAGE_CACHE_SECONDS,
      upsert: true,
    });
    if (upErr) {
      failed++;
      console.log(`  upload failed: ${o.path}: ${upErr.message}`);
      continue;
    }
    rewritten++;
    before += input.byteLength;
    after += shrunk.bytes.byteLength;
  }
  console.log(
    `rewritten ${rewritten} (${mb(before)} -> ${mb(after)}), left alone ${skipped}, failed ${failed}, downloaded ${mb(downloaded)}`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
