import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock llm-parser to provide LLMApiError class
vi.mock("@/lib/ingestion/llm-parser", () => {
  class LLMApiError extends Error {
    public readonly retryable: boolean;
    constructor(message: string, retryable = true) {
      super(message);
      this.name = "LLMApiError";
      this.retryable = retryable;
    }
  }
  return { LLMApiError };
});

import { withLLMRetry } from "@/lib/ingestion/llm-retry";
import { LLMApiError } from "@/lib/ingestion/llm-parser";

describe("withLLMRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns result on first-try success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withLLMRetry(fn, "test");
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable LLMApiError", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMApiError("rate limit", true))
      .mockResolvedValue("success");

    const promise = withLLMRetry(fn, "test");
    // Advance past the backoff delay (2s + up to 1s jitter)
    await vi.advanceTimersByTimeAsync(4000);
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws immediately on non-retryable LLMApiError", async () => {
    const fn = vi.fn().mockRejectedValue(new LLMApiError("bad JSON", false));

    await expect(withLLMRetry(fn, "test")).rejects.toThrow("bad JSON");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws immediately on non-retryable generic error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("TypeError: cannot read"));

    await expect(withLLMRetry(fn, "test")).rejects.toThrow("TypeError: cannot read");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("detects permanent quota exhaustion and fails fast", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new Error("GenerateRequestsPerDayPerProjectPerModel limit exceeded"));

    await expect(withLLMRetry(fn, "test")).rejects.toThrow("Daily quota exhausted");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exhausts all retries and throws the last error", async () => {
    const error = new LLMApiError("429 rate limit", true);
    const fn = vi.fn().mockRejectedValue(error);

    const promise = withLLMRetry(fn, "test").catch((e: Error) => e);
    // Advance through all retry delays (2s, 4s, 8s + jitter for each)
    await vi.advanceTimersByTimeAsync(20000);

    const result = await promise;
    expect(result).toBe(error);
    expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it("retries on 429 rate limit messages from generic errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("429 Too Many Requests"))
      .mockResolvedValue("ok");

    const promise = withLLMRetry(fn, "test");
    await vi.advanceTimersByTimeAsync(4000);
    const result = await promise;

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
