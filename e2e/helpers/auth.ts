import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const TEST_USER_EMAIL = "e2e-dashboard-test@theubudian.test";
export const TEST_USER_PASSWORD = "E2eTestPass123!";
export const TEST_ADMIN_EMAIL = "e2e-admin-test@theubudian.test";
export const TEST_ADMIN_PASSWORD = "E2eAdminPass123!";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Ensure a test user exists and return their ID.
 */
export async function ensureTestUser(
  email: string,
  password: string,
  role: "user" | "admin" = "user",
  displayName = "E2E Test User"
): Promise<string> {
  const admin = getAdminClient();

  // Try creating the user first — if it already exists, we'll handle the error
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName },
  });

  if (data?.user) {
    // New user created — set role
    await admin
      .from("profiles")
      .update({ role, display_name: displayName })
      .eq("id", data.user.id);
    return data.user.id;
  }

  if (error && error.message.includes("already been registered")) {
    // User exists — find them by listing users
    const { data: listData } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });
    const existing = listData?.users?.find((u) => u.email === email);
    if (existing) {
      await admin
        .from("profiles")
        .update({ role, display_name: displayName })
        .eq("id", existing.id);
      return existing.id;
    }
  }

  throw new Error(
    `Failed to create or find test user: ${error?.message ?? "unknown error"}`
  );
}

/**
 * Sign in as a test user and set the auth cookies on the Playwright page.
 */
export async function signInAsUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Sign in via Supabase REST API to get a session
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth failed: ${response.status} ${text}`);
  }

  const session = await response.json();

  // Set the Supabase auth cookies on the page
  // Supabase SSR stores the session in cookies with a specific naming pattern
  const projectRef = SUPABASE_URL.replace("https://", "").replace(
    ".supabase.co",
    ""
  );
  const cookieName = `sb-${projectRef}-auth-token`;

  const cookieValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    expires_in: session.expires_in,
    token_type: "bearer",
    type: "access",
    user: session.user,
  });

  // Supabase SSR splits large cookies into chunks
  const encodedValue = encodeURIComponent(cookieValue);
  const CHUNK_SIZE = 3180; // Supabase default chunk size
  const chunks = [];
  for (let i = 0; i < encodedValue.length; i += CHUNK_SIZE) {
    chunks.push(encodedValue.slice(i, i + CHUNK_SIZE));
  }

  const domain = "localhost";
  const cookies = [];

  if (chunks.length === 1) {
    cookies.push({
      name: cookieName,
      value: decodeURIComponent(chunks[0]),
      domain,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    });
  } else {
    for (let i = 0; i < chunks.length; i++) {
      cookies.push({
        name: `${cookieName}.${i}`,
        value: decodeURIComponent(chunks[i]),
        domain,
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax" as const,
      });
    }
  }

  await page.context().addCookies(cookies);
}

/**
 * Clean up test data for a user.
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  const admin = getAdminClient();
  await admin.from("saved_events").delete().eq("profile_id", userId);
  await admin.from("quiz_results").delete().eq("profile_id", userId);
}
