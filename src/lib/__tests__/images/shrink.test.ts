import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  shrinkForWeb,
  WEB_IMAGE_MAX_WIDTH,
  WEB_IMAGE_MAX_HEIGHT,
} from "@/lib/images/shrink";

/** A photo-like image: smooth gradients with light grain, so PNG stays big. */
async function noisy(width: number, height: number, format: "png" | "jpeg", alpha = false) {
  const channels = alpha ? 4 : 3;
  const raw = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const grain = ((i * 2654435761) >>> 0) % 7;
      raw[i] = Math.floor((x / width) * 240) + grain;
      raw[i + 1] = Math.floor((y / height) * 240) + grain;
      raw[i + 2] = Math.floor(((x + y) / (width + height)) * 240) + grain;
      if (alpha) raw[i + 3] = 200;
    }
  }
  const img = sharp(raw, { raw: { width, height, channels } });
  return new Uint8Array(format === "png" ? await img.png().toBuffer() : await img.jpeg({ quality: 95 }).toBuffer());
}

describe("shrinkForWeb", () => {
  it("turns a large PNG into a smaller JPEG no wider than the cap", async () => {
    const input = await noisy(3000, 2000, "png");
    const out = await shrinkForWeb(input, "image/png");
    expect(out.contentType).toBe("image/jpeg");
    expect(out.ext).toBe("jpg");
    expect(out.bytes.byteLength).toBeLessThan(input.byteLength / 4);
    const meta = await sharp(out.bytes).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(WEB_IMAGE_MAX_WIDTH);
  });

  it("caps a very tall poster by height", async () => {
    const input = await noisy(1000, 4000, "jpeg");
    const out = await shrinkForWeb(input, "image/jpeg");
    const meta = await sharp(out.bytes).metadata();
    expect(meta.height).toBe(WEB_IMAGE_MAX_HEIGHT);
    expect(meta.width).toBeLessThan(1000);
  });

  it("does not enlarge a small image", async () => {
    const input = await noisy(400, 300, "png");
    const out = await shrinkForWeb(input, "image/png");
    const meta = await sharp(out.bytes).metadata();
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(300);
  });

  it("flattens a transparent PNG instead of failing", async () => {
    const input = await noisy(800, 600, "png", true);
    const out = await shrinkForWeb(input, "image/png");
    expect(out.contentType).toBe("image/jpeg");
    expect((await sharp(out.bytes).metadata()).hasAlpha).toBeFalsy();
  });

  it("keeps a small JPEG that would not get smaller", async () => {
    const input = new Uint8Array(
      await sharp({ create: { width: 200, height: 200, channels: 3, background: "#336655" } })
        .jpeg({ quality: 30, mozjpeg: true })
        .toBuffer()
    );
    const out = await shrinkForWeb(input, "image/jpeg");
    expect(out.bytes.byteLength).toBeLessThanOrEqual(input.byteLength);
    expect(out.contentType).toBe("image/jpeg");
  });

  it("passes GIFs through untouched", async () => {
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0, 0, 0]);
    const out = await shrinkForWeb(gif, "image/gif");
    expect(out.bytes).toBe(gif);
    expect(out.ext).toBe("gif");
  });

  it("returns the original bytes when the data is not an image", async () => {
    const junk = new Uint8Array(2048);
    const out = await shrinkForWeb(junk, "image/png");
    expect(out.bytes).toBe(junk);
    expect(out.contentType).toBe("image/png");
    expect(out.ext).toBe("png");
  });
});
