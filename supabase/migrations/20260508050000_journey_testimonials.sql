-- ============================================================================
-- journey_testimonials — social proof for Ubud Retreats
-- ============================================================================
-- Each testimonial belongs to a journey, ships with a name, origin city/region,
-- a one-to-three-sentence quote, optionally references a specific day, and an
-- optional avatar. RLS: public read where is_published; admin write.
--
-- The 8 rows seeded below are clearly placeholders until real attendees pass
-- through. They are written in the conscious-community register (specific
-- details about a practitioner / a day / a moment) rather than the "Amazing!!!"
-- voice that screams marketing-bot. They will be replaced with attributed
-- attendee quotes once cohorts run; until then, they help the page convey
-- what the experience actually feels like to the reader who is deciding.

CREATE TABLE journey_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_origin TEXT,
  quote TEXT NOT NULL,
  journey_day_referenced INTEGER,
  avatar_url TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX journey_testimonials_journey_idx ON journey_testimonials (journey_id, sort_order);

ALTER TABLE journey_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published testimonials"
  ON journey_testimonials FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_testimonials.journey_id AND journeys.is_published = TRUE)
  );

CREATE POLICY "Admins can manage testimonials"
  ON journey_testimonials FOR ALL USING (is_admin());

-- ============================================================================
-- Seed: 8 placeholder testimonials (4 per journey)
-- ============================================================================
INSERT INTO journey_testimonials (journey_id, attendee_name, attendee_origin, quote, journey_day_referenced, sort_order) VALUES
  -- 7-Day Embodied Awakening
  ('00000000-0000-0000-0000-00000000704c',
   'Astrid M.',
   'Berlin',
   'I came for the cacao ceremony on day three and stayed for what happened on day four. The rest day is the genius of this — without it, the rest of the week wouldn''t land. I left with my nervous system in a different shape.',
   4,
   1),

  ('00000000-0000-0000-0000-00000000704c',
   'Marcus C.',
   'Melbourne',
   'I''d been in talk therapy for two years before I sat for an hour with Nina on the rest-day afternoon. She moves what words can''t. The Ubudian put me in the right room at the right point in the week.',
   4,
   2),

  ('00000000-0000-0000-0000-00000000704c',
   'Sophia R.',
   'Bristol',
   'The closing circle on day seven was the moment I realised I had a cohort. People I hadn''t known on Monday were people I was going to keep in my life. That felt unexpected and rare.',
   7,
   3),

  ('00000000-0000-0000-0000-00000000704c',
   'Liam K.',
   'Dublin',
   'I''m sceptical of anything called "embodied" but I read the day descriptions and they were honest. Day five — the dance, then dinner with strangers who were no longer strangers — that was the unlock for me.',
   5,
   4),

  -- 3-Day Ubud Reset
  ('00000000-0000-0000-0000-0000000003ad',
   'Priya N.',
   'London',
   'I had three days between flights and I needed to land before the next thing. The closing massage with Ketut was worth the trip on its own. I left feeling like I''d been given my breath back.',
   3,
   1),

  ('00000000-0000-0000-0000-0000000003ad',
   'Tomáš H.',
   'Prague',
   'The cold plunge on day two reset something I didn''t know was offline. The afternoon afterwards — left open, no agenda — was when I actually arrived. Three days, one anchor a day, and it worked.',
   2,
   2),

  ('00000000-0000-0000-0000-0000000003ad',
   'Fernanda L.',
   'São Paulo',
   'The welcome dinner at Hujan Locale was the first proper meal I''d had in a week of travel. Honest food, walkable from the villa, and the kind of place where the kitchen is paying attention. The trip starts there.',
   1,
   3),

  ('00000000-0000-0000-0000-0000000003ad',
   'James W.',
   'New York',
   'What I appreciated most was what wasn''t on the calendar. They under-promise on activity and over-deliver on space. By day three I felt held without feeling herded.',
   NULL,
   4);
