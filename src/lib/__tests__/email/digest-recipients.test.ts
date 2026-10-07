import { describe, it, expect } from "vitest";
import { digestRecipients } from "@/lib/email/digest-recipients";

const profile = (o: Partial<Parameters<typeof digestRecipients>[0][number]>) => ({
  id: "p1",
  email: "a@x.com",
  email_opt_out: false,
  primary_archetype: null,
  ...o,
});

describe("digestRecipients", () => {
  it("sends to active newsletter subscribers who have no profile", () => {
    const r = digestRecipients([], [{ email: "Sub@X.com ", status: "active", archetype: "seeker" }], new Set());
    expect(r).toEqual([{ email: "sub@x.com", archetype: "seeker" }]);
  });

  it("sends each address once, preferring the profile's own archetype", () => {
    const r = digestRecipients(
      [profile({ email: "a@x.com", primary_archetype: "explorer" })],
      [{ email: "A@x.com", status: "active", archetype: "seeker" }],
      new Set(),
    );
    expect(r).toEqual([{ email: "a@x.com", archetype: "explorer" }]);
  });

  it("keeps profiles that only saved events, and skips profiles with neither", () => {
    const r = digestRecipients(
      [profile({ id: "saver", email: "s@x.com" }), profile({ id: "idle", email: "i@x.com" })],
      [],
      new Set(["saver"]),
    );
    expect(r.map((x) => x.email)).toEqual(["s@x.com"]);
  });

  it("an unsubscribe on either list stops the address", () => {
    const r = digestRecipients(
      [profile({ email: "optout@x.com", email_opt_out: true, primary_archetype: "seeker" })],
      [
        { email: "optout@x.com", status: "active", archetype: null },
        { email: "gone@x.com", status: "unsubscribed", archetype: null },
      ],
      new Set(),
    );
    expect(r).toEqual([]);
  });

  it("never mails test or placeholder addresses", () => {
    const r = digestRecipients(
      [profile({ email: "test-admin@theubudian.test", primary_archetype: "seeker" })],
      [
        { email: "e2e-test@example.com", status: "active", archetype: null },
        { email: "real@gmail.com", status: "active", archetype: null },
      ],
      new Set(),
    );
    expect(r).toEqual([{ email: "real@gmail.com", archetype: null }]);
  });
});
