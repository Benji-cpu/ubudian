/**
 * Who gets the weekly email: every active newsletter subscriber, plus every
 * profile with a quiz archetype or a saved event — one entry per address.
 * An unsubscribe on either list (profile opt-out, or a subscriber row that is
 * no longer active) stops the address entirely. A profile's own archetype
 * beats the one given at sign-up.
 */
export type DigestProfile = {
  id: string;
  email: string | null;
  email_opt_out: boolean;
  primary_archetype: string | null;
};
export type DigestSubscriber = { email: string; status: string | null; archetype: string | null };
export type DigestRecipient = { email: string; archetype: string | null };

const norm = (e: string) => e.toLowerCase().trim();

export function digestRecipients(
  profiles: DigestProfile[],
  subscribers: DigestSubscriber[],
  saverIds: Set<string>,
): DigestRecipient[] {
  const stopped = new Set<string>();
  for (const p of profiles) if (p.email && p.email_opt_out) stopped.add(norm(p.email));
  for (const s of subscribers) if (s.status !== "active") stopped.add(norm(s.email));

  const byEmail = new Map<string, string | null>();
  for (const s of subscribers) if (s.status === "active") byEmail.set(norm(s.email), s.archetype);
  for (const p of profiles) {
    if (!p.email || !(p.primary_archetype || saverIds.has(p.id))) continue;
    const email = norm(p.email);
    byEmail.set(email, p.primary_archetype ?? byEmail.get(email) ?? null);
  }

  return [...byEmail]
    .filter(([email]) => !stopped.has(email))
    .map(([email, archetype]) => ({ email, archetype }));
}
