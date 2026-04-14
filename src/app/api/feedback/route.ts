import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";
import { feedbackNotification } from "@/lib/email-templates";
import { NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  type: z.enum(["bug", "suggestion", "general"]),
  message: z.string().min(10).max(2000),
  email: z.string().email().optional().or(z.literal("")),
  page_url: z.string().optional().or(z.literal("")),
  page_title: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")), // honeypot
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`feedback:${ip}`, { limit: 3, windowSeconds: 900 });
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

    const supabase = createAdminClient();
    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await supabase.from("feedback").insert({
      type: data.type,
      message: data.message,
      email: data.email || null,
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
        `New feedback: ${data.type}`,
        feedbackNotification({
          type: data.type,
          message: data.message,
          pageUrl: data.page_url || null,
          email: data.email || null,
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
