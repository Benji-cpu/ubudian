import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateImage } from "@/lib/stability";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { success } = rateLimit(`image-gen:${ip}`, { limit: 10, windowSeconds: 3600 });
  if (!success) {
    return NextResponse.json({ error: "Too many image generation requests. Please try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { prompt, folder = "blog" } = body as {
    prompt: string;
    folder?: string;
  };

  const ALLOWED_FOLDERS = ["blog", "stories", "events", "tours"] as const;
  if (!ALLOWED_FOLDERS.includes(folder as (typeof ALLOWED_FOLDERS)[number])) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    );
  }

  try {
    const imageBuffer = await generateImage(prompt);

    const supabase = createAdminClient();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
