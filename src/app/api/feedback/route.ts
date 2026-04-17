import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";
import { feedbackNotification } from "@/lib/email-templates";
import { NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  message: z.string().min(10).max(2000),
  image_url: z.string().url().optional().or(z.literal("")),
  page_url: z.string().optional().or(z.literal("")),
  page_title: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")), // honeypot
});

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
      return NextResponse.json({ success: true });
    }

    const admin = createAdminClient();
    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await admin.from("feedback").insert({
      type: "general",
      message: data.message,
      email: user.email || null,
      profile_id: user.id,
      image_url: data.image_url || null,
      page_url: data.page_url || null,
      page_title: data.page_title || null,
      user_agent: userAgent,
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
      sendTransactionalEmail(
        adminEmail,
        "New feedback: General",
        feedbackNotification({
          type: "general",
          message: data.message,
          pageUrl: data.page_url || null,
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
