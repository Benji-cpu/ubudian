import { z } from "zod";
import { EVENT_CATEGORIES } from "@/lib/constants";

/**
 * What the events-desk routine may send. The routine reads Instagram captions
 * and venue pages written by strangers, so this schema (plus the guards in
 * `guards.ts`) is the prompt-injection boundary: shape, ranges, hosts.
 */
const PUBLISHABLE_CATEGORIES = EVENT_CATEGORIES.filter((c) => c !== "Other") as [string, ...string[]];

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const https = z.string().url().max(500).refine((u) => u.startsWith("https://"), "https only");

export const busEventSchema = z.object({
  title: z.string().trim().min(6).max(120),
  description: z.string().trim().min(40).max(2000),
  short_description: z.string().trim().min(20).max(200),
  category: z.enum(PUBLISHABLE_CATEGORIES),
  venue_name: z.string().trim().min(3).max(120),
  venue_address: z.string().trim().max(200).nullish(),
  start_date: ymd,
  end_date: ymd.nullish(),
  start_time: hm.nullish(),
  end_time: hm.nullish(),
  price_info: z.string().trim().max(80).nullish(),
  external_ticket_url: https.nullish(),
  organizer_name: z.string().trim().max(120).nullish(),
  organizer_instagram: z.string().regex(/^[a-z0-9._]{2,30}$/i).nullish(),
  cover_image_url: https.nullish(),
  source_url: https,
  event_tier: z.enum(["core", "discovery"]).default("core"),
});

export const busItemSchema = z.object({
  /** `<registry id>:<post or page id>`, echoed back so the bus can score sources. */
  ref: z.string().min(3).max(200),
  kind: z.enum(["instagram", "page"]),
  event: busEventSchema,
  verdict: z.object({ ok: z.boolean(), reason: z.string().trim().min(3).max(300) }),
});

export const busIngestSchema = z.object({
  date: ymd,
  items: z.array(busItemSchema).max(12),
});

export const busPicksSchema = z.object({
  week_start: ymd,
  picks: z
    .array(z.object({ event_id: z.string().uuid(), why: z.string().trim().min(10).max(140) }))
    .min(1)
    .max(10),
});

export const busReportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  markdown: z.string().min(200).max(40_000),
});

export type BusItem = z.infer<typeof busItemSchema>;
