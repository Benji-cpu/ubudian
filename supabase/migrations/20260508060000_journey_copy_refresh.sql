-- ============================================================================
-- Copy refresh — drop apologetic / placeholder phrasing from journey copy
-- ============================================================================
-- The original seed had "we'll add partners as we sign them" type lines that
-- read as apologetic. The user pushed back on 2026-05-08 — "you don't need to
-- say we'll add partners as we sign them — say they'll stand in beautiful
-- light villa." This migration rewrites the load-bearing copy on both
-- launch retreats with confident, specific language. Authors can refine
-- further in admin without code changes.
--
-- The new "What this retreat holds" icon row on the page now carries the
-- high-level "what you get" beats, so whats_included can be more atmospheric
-- and less listy.

-- ----------------------------------------------------------------------------
-- 3-Day Ubud Reset
-- ----------------------------------------------------------------------------
UPDATE journeys SET
  whats_included = E'**Where you stay** — a quiet light-filled villa in Penestanan or Nyuh Kuning, walking distance to a slow breakfast and the morning anchor.\n\n**What we anchor** — one welcome dinner at Hujan Locale, one body practice on day two (yoga or cold plunge, your pick), one closing massage with Ketut Arsana at Ubud Bodyworks, one farewell meal at Moksa.\n\n**What we leave open** — afternoons, integrations, the unplanned conversation in a cafe.\n\n**What we don''t do** — schedule you back-to-back. The reset is the point.',
  who_its_for = E'You''ve just landed. You''re jet-lagged or overworked or both. You don''t want to *do* Ubud — you want to *arrive* in it.\n\nSlow over deep. Curious over committed. Three days that don''t cost you the holiday you came for.',
  practical_info = E'**When** — any time of year. Dry season (April–October) is easier on the rain, but the wet season has its own slower magic.\n\n**Budget** — $40–120/night for the villa, $30–80 across three days for the anchors and meals.\n\n**Bring** — a sarong, a notebook, an early bedtime, a willingness to do less.'
WHERE id = '00000000-0000-0000-0000-0000000003ad';

-- ----------------------------------------------------------------------------
-- 7-Day Embodied Awakening
-- ----------------------------------------------------------------------------
UPDATE journeys SET
  whats_included = E'**Where you stay** — a quiet villa in Penestanan, Nyuh Kuning, or up the Tegallalang ridge. Light-filled, walking distance to your morning anchors and a slow breakfast.\n\n**What we anchor** — a welcome dinner at Hujan Locale, one cacao or sound ceremony mid-week, an ecstatic dance afternoon followed by a cohort dinner at Moksa, a temple morning at Tirta Empul or Goa Gajah, a closing circle, and a farewell at Locavore NXT.\n\n**What''s woven in** — morning yoga at the Yoga Barn or in your villa, optional integration teas in the evenings, a real rest day, evening meals where the cohort can land.\n\n**What we leave open** — most afternoons, the pull-up conversation, the unplanned thing that finds you.',
  who_its_for = E'You came to deal with your stuff and you''re willing to do the work. You like the practitioners who''ve done the work themselves. You can sit with cold water, with cacao, with silence, with a stranger''s eye contact for longer than is comfortable.\n\nThis isn''t a beginner reset. It''s a week of thresholds.',
  practical_info = E'**When** — any month. New moon and full moon weeks have the strongest ceremony lineup; dry season (April–October) gives you reliable mornings.\n\n**Budget** — $80–200/night for the villa across the week, $200–500 total for the anchor ceremonies, dance, dinners, and a closing massage.\n\n**Bring** — a journal, a sarong, an open evening on day five for the cohort dinner, a willingness to leave with a different sentence than you arrived with.'
WHERE id = '00000000-0000-0000-0000-00000000704c';
