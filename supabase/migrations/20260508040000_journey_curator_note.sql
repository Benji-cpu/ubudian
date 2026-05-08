-- Curator's note: a 2-3 sentence editorial aside surfaced under the hero
-- quote on a journey detail page. Authorial voice — sets the retreat
-- apart from algorithmic listicles.
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS curator_note TEXT;
