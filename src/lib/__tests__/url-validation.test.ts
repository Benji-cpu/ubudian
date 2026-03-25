import { describe, it, expect } from "vitest";
import { isSafeUrl, safeUrlOrEmpty } from "@/lib/url-validation";

describe("isSafeUrl", () => {
  it("allows http URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("http://localhost:4000/events")).toBe(true);
  });

  it("allows https URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("https://maps.google.com/place?q=ubud")).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("javascript:void(0)")).toBe(false);
    expect(isSafeUrl("JAVASCRIPT:alert('xss')")).toBe(false);
  });

  it("rejects data: URLs", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects vbscript: URLs", () => {
    expect(isSafeUrl("vbscript:MsgBox('xss')")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isSafeUrl("not-a-url")).toBe(false);
    expect(isSafeUrl("://missing-protocol")).toBe(false);
  });

  it("returns false for null/undefined/empty", () => {
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});

describe("safeUrlOrEmpty", () => {
  it("allows empty strings", () => {
    expect(safeUrlOrEmpty("")).toBe(true);
  });

  it("allows undefined", () => {
    expect(safeUrlOrEmpty(undefined)).toBe(true);
  });

  it("allows valid https URLs", () => {
    expect(safeUrlOrEmpty("https://example.com")).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    expect(safeUrlOrEmpty("javascript:alert(1)")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(safeUrlOrEmpty("not-a-url")).toBe(false);
  });
});
