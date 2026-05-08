import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  parseEventFromText,
  parseEventFromImageBuffer,
} from "@/lib/ingestion/llm-parser";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Gemini calls can take 5–10s for image inputs; give the route headroom
// (Vercel hobby caps at 10s, so this is the realistic ceiling).
export const maxDuration = 30;

const MAX_TEXT_BYTES = 8_000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be signed in to use the AI parser" },
      { status: 401 }
    );
  }

  const { success } = rateLimit(`parse-draft:${user.id}`, {
    limit: 6,
    windowSeconds: 600,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many AI parses. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let text = "";
  let imageBuffer: Buffer | null = null;
  let imageMime = "";

  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      text = String(form.get("text") || "").slice(0, MAX_TEXT_BYTES);
      const file = form.get("image");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: "Image too large (max 6 MB)" },
            { status: 413 }
          );
        }
        if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
          return NextResponse.json(
            { error: "Image must be jpeg, png, webp, or gif" },
            { status: 415 }
          );
        }
        imageBuffer = Buffer.from(await file.arrayBuffer());
        imageMime = file.type;
      }
    } else {
      const body = (await request.json()) as { text?: string };
      text = (body.text || "").slice(0, MAX_TEXT_BYTES);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text.trim() && !imageBuffer) {
    return NextResponse.json(
      { error: "Provide some text or an image to parse" },
      { status: 400 }
    );
  }

  try {
    const events = imageBuffer
      ? await parseEventFromImageBuffer(imageBuffer, imageMime, text || undefined)
      : await parseEventFromText(text);

    const event = events?.[0];
    if (!event) {
      return NextResponse.json(
        { error: "Couldn't pull an event out of that — try adding more detail." },
        { status: 422 }
      );
    }

    return NextResponse.json({ data: event });
  } catch (err) {
    console.error("[parse-draft] LLM error:", err);
    return NextResponse.json(
      { error: "AI parser is unavailable right now. Please fill in the form manually." },
      { status: 502 }
    );
  }
}
