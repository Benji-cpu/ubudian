"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export type ViewerProfile = { loaded: boolean; profile: Profile | null };

/**
 * The signed-in reader's profile, read in the browser.
 *
 * 19 Nov 2026: the header used to read it on the server, which made every
 * page on the site render per request (cookies) and put an auth call on every
 * crawler hit. Vercel paused the team for it (ubudian-v1 was 81% of the
 * Hobby CPU). Reading it here lets public pages be cached.
 */
export function useViewerProfile(): ViewerProfile {
  const [state, setState] = useState<ViewerProfile>({ loaded: false, profile: null });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let lastUserId: string | null | undefined;

    async function load(userId: string | null) {
      if (!userId) {
        if (!cancelled) setState({ loaded: true, profile: null });
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (!cancelled) setState({ loaded: true, profile: (data as Profile | null) ?? null });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      if (userId === lastUserId) return;
      lastUserId = userId;
      // Supabase advises against awaiting its own calls inside this callback.
      setTimeout(() => void load(userId), 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
