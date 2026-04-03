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
      const { data: { user } } = await supabase.auth.getUser();

      // Auto-promote admin email on every login (idempotent)
      // Uses upsert to handle race condition where profile row may not exist yet
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && user?.email === adminEmail) {
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

      // Bridge anonymous quiz results to this profile
      if (user?.email) {
        const bridgeClient = createAdminClient();

        // Find most recent anonymous quiz result with matching email
        const { data: quizResult } = await bridgeClient
          .from("quiz_results")
          .select("id, primary_archetype, user_segment")
          .eq("email", user.email)
          .is("profile_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (quizResult) {
          // Link quiz result to profile
          await bridgeClient
            .from("quiz_results")
            .update({ profile_id: user.id })
            .eq("id", quizResult.id);

          // Update profile with archetype and segment
          await bridgeClient
            .from("profiles")
            .update({
              primary_archetype: quizResult.primary_archetype,
              user_segment: quizResult.user_segment,
            })
            .eq("id", user.id);
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
