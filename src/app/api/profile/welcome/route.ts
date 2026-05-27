import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("welcomed_at")
    .eq("id", user.id)
    .single();

  if (existing?.welcomed_at) {
    return NextResponse.json({ data: { welcomed_at: existing.welcomed_at } });
  }

  const { data, error } = await admin
    .from("profiles")
    .update({ welcomed_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("welcomed_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to mark welcome" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { welcomed_at: data.welcomed_at } });
}
