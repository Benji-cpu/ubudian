import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TEST_USER_EMAIL = "test-user@theubudian.test";
const TEST_ADMIN_EMAIL = "test-admin@theubudian.test";
const TEST_PASSWORD = "TestLogin123!";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const role =
    request.nextUrl.searchParams.get("role") === "admin" ? "admin" : "user";
  const email = role === "admin" ? TEST_ADMIN_EMAIL : TEST_USER_EMAIL;
  const redirectTo = role === "admin" ? "/admin" : "/";

  // Ensure test user exists
  const admin = createAdminClient();
  const { data: createData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: role === "admin" ? "Test Admin" : "Test User",
      },
    });

  let userId: string;

  if (createData?.user) {
    userId = createData.user.id;
  } else if (createError?.message?.includes("already been registered")) {
    const { data: listData } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });
    const existing = listData?.users?.find((u) => u.email === email);
    if (!existing) {
      return NextResponse.json(
        { error: "Failed to find test user" },
        { status: 500 }
      );
    }
    userId = existing.id;
  } else {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create test user" },
      { status: 500 }
    );
  }

  // Ensure correct role in profile
  await admin
    .from("profiles")
    .update({
      role,
      display_name: role === "admin" ? "Test Admin" : "Test User",
    })
    .eq("id", userId);

  // Sign in and set auth cookies on the redirect response
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD });

  return response;
}
