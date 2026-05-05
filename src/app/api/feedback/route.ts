import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";
import { feedbackNotification } from "@/lib/email-templates";
import { NextResponse } from "next/server";
import { z } from "zod";

const activityEventSchema = z.object({
  t: z.number(),
  kind: z.enum(["route", "click", "fetch", "error"]),
  detail: z.string().max(300),
});

const feedbackSchema = z.object({
  type: z.enum(["bug", "suggestion", "general"]).default("general"),
  message: z.string().min(10).max(2000),
  image_url: z.string().url().optional().or(z.literal("")),
  page_url: z.string().nullable().optional(),
  page_title: z.string().nullable().optional(),
  route_params: z.record(z.string(), z.string()).optional(),
  viewport_width: z.number().int().positive().nullable().optional(),
  viewport_height: z.number().int().positive().nullable().optional(),
  activity_trail: z.array(activityEventSchema).max(80).optional(),
  website: z.string().optional().or(z.literal("")), // honeypot
});

function safePageUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Require authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be logged in to submit feedback" },
      { status: 401 }
    );
  }

  // Rate limit by user ID
  const { success } = rateLimit(`feedback:${user.id}`, { limit: 3, windowSeconds: 900 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    // Honeypot check
    if (data.website) {
      console.warn("[feedback] honeypot triggered", {
        userId: user.id,
        pageUrl: data.page_url,
      });
      return NextResponse.json({ success: true });
    }

    const admin = createAdminClient();
    const userAgent = request.headers.get("user-agent") || null;
    const pageUrl = safePageUrl(data.page_url);

    const { error } = await admin.from("feedback").insert({
      type: data.type,
      message: data.message,
      email: user.email || null,
      profile_id: user.id,
      image_url: data.image_url || null,
      page_url: pageUrl,
      page_title: data.page_title || null,
      user_agent: userAgent,
      route_params: data.route_params ?? null,
      viewport_width: data.viewport_width ?? null,
      viewport_height: data.viewport_height ?? null,
      activity_trail: data.activity_trail ?? null,
    });

    if (error) {
      console.error("Feedback submission error:", error);
      return NextResponse.json(
        { error: "Failed to submit feedback. Please try again." },
        { status: 500 }
      );
    }

    // Fire-and-forget admin notification
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const typeLabel = data.type.charAt(0).toUpperCase() + data.type.slice(1);
      sendTransactionalEmail(
        adminEmail,
        `New feedback: ${typeLabel}`,
        feedbackNotification({
          type: data.type,
          message: data.message,
          pageUrl,
          pageTitle: data.page_title || null,
          imageUrl: data.image_url || null,
          email: user.email || null,
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid feedback data. Please check your form." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
