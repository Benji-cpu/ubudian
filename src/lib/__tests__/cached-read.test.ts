import { describe, it, expect, vi } from "vitest";
import { cachedRead } from "@/lib/cached-read";

// Vitest runs outside the Next.js runtime, where there is no cache: the read
// must still work, and a failing read must still fail loudly.
describe("cachedRead outside the Next.js runtime", () => {
  it("runs the read directly and passes its arguments through", async () => {
    const read = vi.fn(async (day: string) => [`row for ${day}`]);
    const cached = cachedRead(read, "test-read", { seconds: 60, tag: "test" });
    expect(await cached("2026-11-13")).toEqual(["row for 2026-11-13"]);
    expect(read).toHaveBeenCalledWith("2026-11-13");
  });

  it("rethrows the read's own error, so a failure is never returned as data", async () => {
    const cached = cachedRead(
      async () => {
        throw new Error("exceed_egress_quota");
      },
      "test-read-fails",
      { seconds: 60, tag: "test" }
    );
    await expect(cached()).rejects.toThrow("exceed_egress_quota");
  });
});
