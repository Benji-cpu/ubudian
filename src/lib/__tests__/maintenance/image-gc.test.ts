import { describe, it, expect } from "vitest";
import {
  shouldGarbageCollectEventImage,
  parseStorageObjectPath,
  type ImageGcCandidate,
} from "@/lib/maintenance/image-gc";

const PROJECT_REF = "vzooblnkztbjgfbdfzxl";
const NOW = new Date("2026-05-07T00:00:00Z");

function candidate(overrides: Partial<ImageGcCandidate> = {}): ImageGcCandidate {
  return {
    id: "evt-1",
    status: "archived",
    start_date: "2025-01-01",
    cover_image_url: `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/images/events/abc.jpg`,
    ...overrides,
  };
}

describe("shouldGarbageCollectEventImage", () => {
  it("collects archived events older than 90 days with a Supabase-hosted image", () => {
    expect(shouldGarbageCollectEventImage(candidate(), NOW, PROJECT_REF)).toBe(true);
  });

  it("skips events that are not archived", () => {
    expect(shouldGarbageCollectEventImage(candidate({ status: "approved" }), NOW, PROJECT_REF)).toBe(
      false,
    );
    expect(shouldGarbageCollectEventImage(candidate({ status: "pending" }), NOW, PROJECT_REF)).toBe(
      false,
    );
  });

  it("skips events with no cover image", () => {
    expect(
      shouldGarbageCollectEventImage(candidate({ cover_image_url: null }), NOW, PROJECT_REF),
    ).toBe(false);
  });

  it("skips images hosted off our Supabase project (preserve external image URLs)", () => {
    const external = "https://images.unsplash.com/photo-123.jpg";
    expect(
      shouldGarbageCollectEventImage(
        candidate({ cover_image_url: external }),
        NOW,
        PROJECT_REF,
      ),
    ).toBe(false);
    const otherProject = "https://other-project.supabase.co/storage/v1/object/public/images/events/x.jpg";
    expect(
      shouldGarbageCollectEventImage(
        candidate({ cover_image_url: otherProject }),
        NOW,
        PROJECT_REF,
      ),
    ).toBe(false);
  });

  it("skips images that are stored under a non-events folder (only events get GC'd)", () => {
    const blogImage = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/images/blog/hero.jpg`;
    expect(
      shouldGarbageCollectEventImage(
        candidate({ cover_image_url: blogImage }),
        NOW,
        PROJECT_REF,
      ),
    ).toBe(false);
  });

  it("skips events whose start_date is within the age threshold", () => {
    const recent = candidate({ start_date: "2026-04-01" });
    expect(shouldGarbageCollectEventImage(recent, NOW, PROJECT_REF)).toBe(false);
  });

  it("treats events with no start_date as eligible (already archived, age unknown)", () => {
    expect(
      shouldGarbageCollectEventImage(candidate({ start_date: null }), NOW, PROJECT_REF),
    ).toBe(true);
  });

  it("respects a custom age threshold", () => {
    const sixtyDaysAgo = candidate({ start_date: "2026-03-07" });
    expect(shouldGarbageCollectEventImage(sixtyDaysAgo, NOW, PROJECT_REF, 30)).toBe(true);
    expect(shouldGarbageCollectEventImage(sixtyDaysAgo, NOW, PROJECT_REF, 90)).toBe(false);
  });

  it("returns false for a malformed URL rather than throwing", () => {
    expect(
      shouldGarbageCollectEventImage(
        candidate({ cover_image_url: "not a url" }),
        NOW,
        PROJECT_REF,
      ),
    ).toBe(false);
  });
});

describe("parseStorageObjectPath", () => {
  it("extracts the in-bucket path from a public Supabase URL", () => {
    const url = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/images/events/abc.jpg`;
    expect(parseStorageObjectPath(url)).toBe("events/abc.jpg");
  });

  it("extracts nested paths", () => {
    const url = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/images/events/2026/05/abc.jpg`;
    expect(parseStorageObjectPath(url)).toBe("events/2026/05/abc.jpg");
  });

  it("returns null for non-storage URLs", () => {
    expect(parseStorageObjectPath("https://images.unsplash.com/photo.jpg")).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(parseStorageObjectPath("not a url")).toBeNull();
  });
});
