import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      }),
    },
  }),
}));

import { persistRemoteImage } from "@/lib/ingestion/image-persistence";

const originalFetch = globalThis.fetch;

function mockFetch(
  body: ArrayBuffer | null,
  init: { status?: number; contentType?: string; contentLength?: string } = {}
) {
  const headers = new Headers();
  if (init.contentType) headers.set("content-type", init.contentType);
  if (init.contentLength) headers.set("content-length", init.contentLength);
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    headers,
    arrayBuffer: async () => body ?? new ArrayBuffer(0),
  } as unknown as Response);
}

describe("persistRemoteImage", () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://supabase.test/public/events/x.jpg" } });
    mockUpload.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns null for invalid URLs", async () => {
    expect(await persistRemoteImage("", "events", "id")).toBeNull();
    expect(await persistRemoteImage("not-a-url", "events", "id")).toBeNull();
  });

  it("uploads a valid jpg and returns the public URL", async () => {
    mockFetch(new ArrayBuffer(2048), { contentType: "image/jpeg", contentLength: "2048" });
    const url = await persistRemoteImage("https://cdn.example.com/a.jpg", "events", "evt-abc");
    expect(url).toBe("https://supabase.test/public/events/x.jpg");
    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [path, , opts] = mockUpload.mock.calls[0];
    expect(path).toMatch(/^events\/evt-abc-\d+-[a-z0-9]+\.jpg$/);
    expect((opts as { contentType: string }).contentType).toBe("image/jpeg");
  });

  it("sniffs JPEG magic bytes when content-type is octet-stream", async () => {
    // JPEG magic: FF D8 FF
    const jpegBytes = new Uint8Array(2048);
    jpegBytes[0] = 0xff;
    jpegBytes[1] = 0xd8;
    jpegBytes[2] = 0xff;
    mockFetch(jpegBytes.buffer, {
      contentType: "application/octet-stream",
      contentLength: "2048",
    });
    const url = await persistRemoteImage("https://api.telegram.org/file/bot-x/photos/file_1", "events", "id");
    expect(url).toBe("https://supabase.test/public/events/x.jpg");
    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [, , opts] = mockUpload.mock.calls[0];
    expect((opts as { contentType: string }).contentType).toBe("image/jpeg");
  });

  it("rejects non-image octet-stream bytes", async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
    mockFetch(garbage.buffer, { contentType: "application/octet-stream" });
    const url = await persistRemoteImage("https://cdn.example.com/a.bin", "events", "id");
    expect(url).toBeNull();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("rejects oversized images (content-length)", async () => {
    mockFetch(new ArrayBuffer(1024), {
      contentType: "image/png",
      contentLength: String(10 * 1024 * 1024),
    });
    const url = await persistRemoteImage("https://cdn.example.com/big.png", "events", "id");
    expect(url).toBeNull();
  });

  it("returns null when upload fails", async () => {
    mockFetch(new ArrayBuffer(2048), { contentType: "image/png", contentLength: "2048" });
    mockUpload.mockResolvedValue({ error: { message: "nope" } });
    const url = await persistRemoteImage("https://cdn.example.com/a.png", "events", "id");
    expect(url).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network"));
    const url = await persistRemoteImage("https://cdn.example.com/a.png", "events", "id");
    expect(url).toBeNull();
  });

  it("returns null for empty body", async () => {
    mockFetch(new ArrayBuffer(0), { contentType: "image/png" });
    const url = await persistRemoteImage("https://cdn.example.com/a.png", "events", "id");
    expect(url).toBeNull();
  });
});
