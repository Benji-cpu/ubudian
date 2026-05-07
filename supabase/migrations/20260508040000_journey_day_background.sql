-- Add `background_image_url` to journey_days. Used by JourneyDayCard to render
-- a low-opacity atmospheric image behind each day's theme/intention text.
-- Optional, nullable; days without it render as before.

ALTER TABLE journey_days
  ADD COLUMN IF NOT EXISTS background_image_url TEXT;
