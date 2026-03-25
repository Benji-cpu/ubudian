import { z } from "zod";

const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // AI
  GEMINI_API_KEY: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1),

  // Cron
  CRON_SECRET: z.string().min(1),

  // Optional — validated when present
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
  WAHA_API_URL: z.string().url().optional(),
  WAHA_API_KEY: z.string().min(1).optional(),
  WAHA_WEBHOOK_SECRET: z.string().min(1).optional(),
  STABILITY_AI_API_KEY: z.string().min(1).optional(),
  BEEHIIV_API_KEY: z.string().min(1).optional(),
  BEEHIIV_PUBLICATION_ID: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Returns validated server environment variables.
 * Lazily initialized on first call; throws with specific missing vars on failure.
 */
export function getEnv(): ServerEnv {
  if (cached) return cached;

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
    );
    throw new Error(
      `Missing or invalid environment variables:\n${missing.join("\n")}`
    );
  }

  cached = result.data;
  return cached;
}

/** Reset the cache (for testing). */
export function _resetEnvCache() {
  cached = null;
}
