import { z } from "zod";
import { safeUrlOrEmpty } from "@/lib/url-validation";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
// Free text on a public page: no links, so the form can't be used for spam.
const NO_LINKS = (v: string | undefined) => !v || !/(https?:\/\/|www\.|\.(com|net|io|ru|xyz)\b)/i.test(v);

/** Shared by the intake form (client) and `/api/specials/submit` (server). */
export const specialSubmissionSchema = z.object({
  venue_name: z.string().trim().min(2, "Restaurant name is required").max(80),
  venue_area: z.string().trim().max(60).optional().or(z.literal("")),
  venue_address: z.string().trim().max(160).optional().or(z.literal("")),
  instagram_handle: z
    .string()
    .trim()
    .max(40)
    .regex(/^@?[A-Za-z0-9._]*$/, "Just the handle, e.g. @yourplace")
    .optional()
    .or(z.literal("")),
  website_url: z.string().trim().max(200).optional().or(z.literal("")).refine(safeUrlOrEmpty, "Use a full link starting with https://"),
  title: z.string().trim().min(3, "Say what the deal is").max(80).refine(NO_LINKS, "No links, please"),
  description: z.string().trim().max(300).optional().or(z.literal("")).refine(NO_LINKS, "No links, please"),
  price_idr: z.number().int().min(0).max(10_000_000).nullable().optional(),
  /** What the same thing costs without the deal; lets the review check the 25% rule. */
  normal_price_idr: z.number().int().min(0).max(10_000_000).nullable().optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  start_time: z.string().regex(TIME, "Use HH:MM").optional().or(z.literal("")),
  end_time: z.string().regex(TIME, "Use HH:MM").optional().or(z.literal("")),
  contact_name: z.string().trim().min(2, "Your name is required").max(80),
  contact_phone: z.string().trim().min(6, "A WhatsApp number we can reach you on").max(30),
  contact_email: z.string().trim().email("Valid email, or leave it empty").optional().or(z.literal("")),
  // Honeypot: real people never see this field.
  website: z.string().optional().or(z.literal("")),
});

export type SpecialSubmission = z.infer<typeof specialSubmissionSchema>;
