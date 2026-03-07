import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Auto-promote admin email on every login (idempotent)
      // Uses upsert to handle race condition where profile row may not exist yet
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email === adminEmail) {
          const adminClient = createAdminClient();
          const { error: upsertError } = await adminClient
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email,
                display_name: user.user_metadata?.full_name || user.email,
                avatar_url: user.user_metadata?.avatar_url || null,
                role: "admin",
              },
              { onConflict: "id" }
            );
          if (upsertError) {
            console.error("Failed to upsert admin profile:", upsertError);
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
