-- Delete the demo content the site was seeded with.
--
-- These rows are fixtures, not content. TESTING_GUIDE.md names them as the
-- expected homepage output ("story cards ... Wayan Sukerta, Sarah Chen, etc.").
-- They have been invisible since site_settings switched stories/tours/blog off,
-- but sitemap.ts does not consult those flags, so Google is still being fed
-- ~17 URLs that render an empty shell with a rich <title>. Deleting the rows
-- removes them from the sitemap at the source; the flag-awareness fix in
-- src/app/sitemap.ts handles the section index pages.
--
-- Targeted by explicit slug rather than a bare DELETE, so re-running this
-- cannot touch anything real that gets written later.

BEGIN;

-- newsletter_editions.featured_story_id -> stories is ON DELETE NO ACTION, so
-- the two seed editions must let go of their story before it can be removed.
-- The editions themselves are kept: they are the only rows in the newsletter
-- archive, and unlike the stories they are not named as test fixtures.
UPDATE newsletter_editions
   SET featured_story_id = NULL
 WHERE featured_story_id IN (
   SELECT id FROM stories WHERE slug IN (
     'wayan-sukerta-mask-carver-mas-village',
     'sarah-chen-silicon-valley-sacred-breath',
     'kadek-ariani-farming-future-tegallalang',
     'marco-rossi-tuscany-meets-tropics',
     'ni-luh-putu-eka-yoga-teacher-stayed-home'
   )
 );

DELETE FROM stories WHERE slug IN (
  'wayan-sukerta-mask-carver-mas-village',
  'sarah-chen-silicon-valley-sacred-breath',
  'kadek-ariani-farming-future-tegallalang',
  'marco-rossi-tuscany-meets-tropics',
  'ni-luh-putu-eka-yoga-teacher-stayed-home'
);

-- bookings.tour_id -> tours is ON DELETE CASCADE. Exactly one booking exists
-- and it is itself a fixture: guest_name 'Stripe Verification Test',
-- guest_email 'stripe-test@example.com', status 'refunded', created 2026-04-20.
-- Its payments row survives (payments.booking_id is ON DELETE SET NULL), so the
-- $64.00 refunded charge stays on the books as an audit trail.
DELETE FROM tours WHERE slug IN (
  'ubud-food-trail',
  'hidden-waterfalls-jungle-trek',
  'sacred-water-temples-rice-terraces',
  'campuhan-sayan-artists-ridge-walk',
  'ubud-heritage-walk'
);

DELETE FROM blog_posts WHERE slug IN (
  'what-is-the-ubudian',
  'humans-of-ubud-an-invitation',
  'the-ubud-expat-experience'
);

-- The `experiences` table was superseded by `journeys`: /experiences/[slug] was
-- repointed at journeys and the experiences table never got a replacement
-- route, so this single seed row has been unreachable ever since.
DELETE FROM experiences WHERE slug = 'full-moon-sound-healing';

COMMIT;
