import { z } from "zod";
import { specialSubmissionSchema } from "@/lib/specials/schema";

/** One deal as a venue owner edits it on /venue. Same rules as the public form. */
export const venueDealSchema = specialSubmissionSchema.pick({
  title: true,
  description: true,
  price_idr: true,
  weekdays: true,
  start_time: true,
  end_time: true,
});
export type VenueDealInput = z.infer<typeof venueDealSchema>;

/** A venue an owner adds when it isn't listed yet. */
export const newVenueSchema = specialSubmissionSchema
  .pick({
    venue_name: true,
    venue_area: true,
    venue_address: true,
    instagram_handle: true,
    website_url: true,
    contact_name: true,
    contact_phone: true,
    contact_email: true,
  })
  .extend({ website: z.string().optional().or(z.literal("")) });
export type NewVenueInput = z.infer<typeof newVenueSchema>;

/** The fields an edit may change; anything else in pending_changes is ignored. */
export const EDITABLE_DEAL_FIELDS = ["title", "description", "price_idr", "weekdays", "start_time", "end_time"] as const;

/** Normalise form input into the columns `specials` stores. */
export function dealColumns(d: VenueDealInput) {
  return {
    title: d.title,
    description: d.description || null,
    price_idr: d.price_idr ?? null,
    weekdays: [...new Set(d.weekdays)].sort((a, b) => a - b),
    start_time: d.start_time || null,
    end_time: d.end_time || null,
  };
}
