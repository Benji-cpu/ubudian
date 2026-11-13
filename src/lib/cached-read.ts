/**
 * Caches a public database read for a few minutes, so a page hit does not
 * mean a database hit.
 *
 * Why: every public page used to read Supabase on every request. Crawlers
 * load the homepage every minute or two, each load pulled the whole events
 * list, and in October-November 2026 that added up to 600-950 MB of egress a
 * day, three times the free quota. Supabase blocked the project on 10 Nov.
 *
 * Rules for the function you pass in:
 * - It must not read cookies or headers (use the admin client and select only
 *   public columns).
 * - It must THROW on a database error. A thrown error is never cached, and
 *   while a stale copy exists the cache keeps serving it. Catch outside.
 * - Its arguments are part of the cache key, so pass the Bali date in rather
 *   than reading the clock inside.
 *
 * Outside the Next.js runtime (Vitest, tsx scripts) there is no cache to use,
 * so the read runs directly.
 */
import { unstable_cache } from "next/cache";

export const CACHE_TAGS = {
  events: "events",
  specials: "specials",
  siteSettings: "site-settings",
} as const;

export function cachedRead<Args extends unknown[], Result>(
  read: (...args: Args) => Promise<Result>,
  key: string,
  options: { seconds: number; tag: string }
): (...args: Args) => Promise<Result> {
  const cached = unstable_cache(read, [key], {
    revalidate: options.seconds,
    tags: [options.tag],
  });

  return async (...args: Args) => {
    try {
      return await cached(...args);
    } catch (err) {
      if (err instanceof Error && err.message.includes("incrementalCache missing")) {
        return read(...args);
      }
      throw err;
    }
  };
}
