import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Profile } from "@/types";

/**
 * True when the request carries a Supabase sign-in cookie. Without one there
 * is no session, so skip the auth network call (19 Nov 2026: crawlers made
 * one on every page view; see src/middleware.ts).
 */
async function hasAuthCookie(): Promise<boolean> {
  try {
    const store = await cookies();
    return store.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  } catch {
    return true;
  }
}

export async function getCurrentUser() {
  if (!(await hasAuthCookie())) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!(await hasAuthCookie())) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}
