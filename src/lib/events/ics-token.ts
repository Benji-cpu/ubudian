/**
 * Per-user ICS subscription token management.
 *
 * Each profile gets a long-lived, unguessable UUID token that lets external
 * calendar apps (Apple Calendar, Google Calendar, Outlook) poll the user's
 * saved-events feed without needing to authenticate. The token is generated
 * lazily on first request and stored in `profiles.ics_token`.
 */

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns the profile's ICS token, generating and persisting one if not yet
 * present. Uses the service-role client since this is typically called from
 * server components and API routes.
 */
export async function getOrCreateIcsToken(profileId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("ics_token")
    .eq("id", profileId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load profile for ICS token: ${fetchError.message}`);
  }

  if (profile?.ics_token) {
    return profile.ics_token;
  }

  const token = crypto.randomUUID();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ ics_token: token })
    .eq("id", profileId);

  if (updateError) {
    throw new Error(`Failed to persist ICS token: ${updateError.message}`);
  }

  return token;
}
