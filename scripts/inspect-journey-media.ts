/**
 * One-off survey: what's missing on the journey detail page surfaces
 * (atom geo, practitioner photos, saved_journeys reachability).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  const { data: atoms } = await s
    .from("journey_atoms")
    .select("id, kind, title, latitude, longitude, image_url, practitioner_id, partner_id, google_maps_url")
    .order("kind");
  console.log("ATOMS:");
  for (const a of atoms ?? []) {
    const t = (a.title as string).slice(0, 38).padEnd(38);
    console.log(
      `  ${(a.kind as string).padEnd(14)} ${t} lat=${a.latitude ?? "—"} lng=${a.longitude ?? "—"} img=${a.image_url ? "y" : "n"} pract=${a.practitioner_id ? "y" : "n"} maps=${a.google_maps_url ? "y" : "n"}`,
    );
  }

  const { data: pracs } = await s
    .from("practitioners")
    .select("id, slug, name, photo_url, contact_instagram, base_location");
  console.log("\nPRACTITIONERS:");
  for (const p of pracs ?? []) {
    console.log(
      `  ${(p.name as string).padEnd(22)} photo=${p.photo_url ? "y" : "n"} ig=${p.contact_instagram ?? "—"}`,
    );
  }

  const { data: sj, error: sjErr } = await s.from("saved_journeys").select("id").limit(1);
  console.log(`\nsaved_journeys reachable: ${sj !== null ? "yes" : "no"}${sjErr ? ` (err: ${sjErr.message})` : ""}`);

  const { data: js } = await s.from("journeys").select("id, slug, title, cover_image_url");
  console.log("\nJOURNEYS:");
  for (const j of js ?? []) {
    console.log(`  ${(j.title as string).padEnd(34)} cover=${j.cover_image_url ? "y" : "n"}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
