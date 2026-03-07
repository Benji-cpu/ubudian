# F33: Deployment

**Phase:** 8 — Polish & Launch
**Depends on:** All features, F31, F32
**Blocks:** None (this is the final step)

---

## What

Deploy to Vercel, connect domain, configure production environment.

## Steps

1. **Vercel Setup**
   - Connect GitHub repo to Vercel
   - Configure build settings (Next.js auto-detected)
   - Set all environment variables in Vercel dashboard

2. **Supabase Production**
   - Ensure Supabase project is on appropriate plan
   - Run migrations on production database
   - Seed with initial data (real events, tour details)
   - Configure Row Level Security policies

3. **Domain**
   - Register domain (theubudian.com or similar)
   - Configure DNS to point to Vercel
   - Vercel auto-provisions SSL certificate

4. **Beehiiv Production**
   - Create Beehiiv publication (if not already)
   - Set API key in Vercel env vars
   - Test subscriber signup in production

5. **Resend Production**
   - Verify sending domain in Resend
   - Set API key in Vercel env vars
   - Configure SPF/DKIM records for transactional emails

6. **Final Checks**
   - [ ] All pages load without errors
   - [ ] Newsletter signup works end-to-end
   - [ ] Event submission works
   - [ ] Admin login works
   - [ ] Tour booking WhatsApp links work
   - [ ] Images load from Supabase Storage
   - [ ] SEO: meta tags, OG images, structured data all present
   - [ ] Sitemap accessible
   - [ ] No console errors
   - [ ] Performance: Lighthouse score > 90

## Verification

- Visit production URL → site loads
- Sign up for newsletter → appears in Beehiiv
- Submit an event → appears in admin
- Share a page on social media → OG preview looks correct
- Google Search Console: submit sitemap, check indexing
