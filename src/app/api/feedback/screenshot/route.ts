import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  // Require authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("screenshot") as File | null;
    if (!file) {
      return NextResponse.json(
        { data: null, error: "No screenshot file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { data: null, error: "Screenshot exceeds 2MB limit" },
        { status: 400 }
      );
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const path = `feedback/${user.id}/${id}.jpg`;

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("images")
      .upload(path, new Uint8Array(arrayBuffer), {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Feedback screenshot upload error:", uploadError);
      return NextResponse.json(
        { data: null, error: "Failed to upload screenshot" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("images").getPublicUrl(path);

    return NextResponse.json({ data: { url: publicUrl }, error: null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload screenshot";
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
