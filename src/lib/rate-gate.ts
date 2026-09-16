/**
 * A minimum-interval gate for calls against a per-MINUTE API ceiling.
 *
 * Why this exists: `tag-embed-sweep` went red 9 nights running on Gemini 429s.
 * The first fix lowered in-flight concurrency 5/4/4 → 2, on the reasoning that
 * fewer parallel calls means fewer rate-limit rejections. It does not: a
 * concurrency cap bounds how many calls overlap, not how many start per
 * minute. Two workers each finishing in ~2s still issue ~60 calls a minute,
 * four times a 15 RPM free-tier ceiling. Measured on 2026-09-16 with
 * concurrency 2: succeeded=4, failed=36.
 *
 * So pace the calls instead. Each caller reserves the next free slot and waits
 * for it; slots are handed out `60000 / rpm` apart. The reservation is taken
 * synchronously before the await, so concurrent workers queue behind one
 * another rather than all reading the same clock and colliding — which is the
 * bug a naive "sleep if the last call was recent" version would have.
 *
 * This bounds the START rate. It does not retry; the callers already do.
 */
export function createRateGate(requestsPerMinute: number): () => Promise<void> {
  if (!Number.isFinite(requestsPerMinute) || requestsPerMinute <= 0) {
    throw new Error(`rate gate needs a positive rpm, got ${requestsPerMinute}`);
  }
  const minIntervalMs = Math.ceil(60_000 / requestsPerMinute);
  let nextSlot = 0;

  return async function gate(): Promise<void> {
    const now = Date.now();
    const slot = Math.max(now, nextSlot);
    nextSlot = slot + minIntervalMs;
    const wait = slot - now;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  };
}

/**
 * Free-tier `gemini-2.5-flash-lite` is documented at 15 requests/minute. 10
 * leaves room for the editorial gate's moderation calls, which run from Vercel
 * against the same key and fail OPEN when they are throttled — the sweep going
 * green at the cost of publishing unmoderated events would be a bad trade.
 * Override with --rpm or GEMINI_RPM once the key has billing.
 */
export const DEFAULT_FLASH_LITE_RPM = Number(process.env.GEMINI_RPM) || 10;
