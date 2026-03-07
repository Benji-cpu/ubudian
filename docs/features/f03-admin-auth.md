# F03: Admin Authentication

**Phase:** 1 — Foundation
**Depends on:** F01
**Blocks:** F04

---

## What

Simple admin-only auth using Supabase Auth. Only one user (you) needs to log in. No public registration.

## Pages

- `src/app/admin/login/page.tsx` — Login form (email + password)

## Implementation

### Auth Flow
1. Admin navigates to `/admin`
2. Middleware checks for Supabase session
3. No session → redirect to `/admin/login`
4. Login with email + password → Supabase Auth
5. On success → redirect to `/admin`
6. Session persisted via Supabase SSR cookies

### Middleware
- `src/middleware.ts` — Check auth on all `/admin/*` routes (except `/admin/login`)
- Use `@supabase/ssr` for server-side session management

### Setup
- Create admin user manually in Supabase dashboard (your email + password)
- No signup flow needed — this is admin-only
- Consider: add `ADMIN_EMAIL` env var and validate against it for extra security

## Verification

- Unauthenticated visit to `/admin` redirects to `/admin/login`
- Login with correct credentials → lands on admin dashboard
- Incorrect credentials → error message
- Session persists across page refreshes
- Logout works
