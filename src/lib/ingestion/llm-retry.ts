/**
 * LLM retry utility with exponential backoff.
 *
 * Wraps async LLM calls to handle transient failures (rate limits, network errors).
 * Only retries on LLMApiError with retryable=true; non-retryable errors are thrown immediately.
 */

import { LLMApiError } from "./llm-parser";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap an async function with retry logic and exponential backoff.
 *
 * @param fn - The async function to execute (typically model.generateContent)
 * @param label - A label for logging (e.g., "classifyMessage")
 * @returns The result of the function
 * @throws The original error if non-retryable or retries exhausted
 */
export async function withLLMRetry<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry non-retryable LLMApiErrors (e.g., bad JSON parse)
      if (err instanceof LLMApiError && !err.retryable) {
        throw err;
      }

      // Detect permanent daily/project-level quota exhaustion — retrying wastes quota
      const isPermanentQuota =
        err instanceof Error &&
        /GenerateRequestsPerDayPerProjectPerModel|InputTokensPerDay|free_tier.*limit.*0/i.test(err.message);

      if (isPermanentQuota) {
        console.error(`[llm-retry] ${label} hit permanent daily quota limit — failing fast (no retry):`, err.message);
        throw new LLMApiError(`Daily quota exhausted: ${err.message}`, false);
      }

      // Check if it's a rate limit or retryable error
      const isRetryable =
        (err instanceof LLMApiError && err.retryable) ||
        (err instanceof Error && /429|rate.?limit|quota|resource.?exhausted/i.test(err.message));

      if (!isRetryable) {
        throw err;
      }

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s + jitter (0-1s)
        const backoff = BASE_DELAY_MS * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const waitMs = backoff + jitter;

        console.warn(
          `[llm-retry] ${label} attempt ${attempt + 1}/${MAX_RETRIES} failed, retrying in ${Math.round(waitMs)}ms:`,
          err instanceof Error ? err.message : err
        );

        await delay(waitMs);
      }
    }
  }

  throw lastError;
}
