-- ============================================================================
-- Propagate practitioner photos onto their atoms + add venue Instagram handles
-- ============================================================================
-- 1. The four practitioner rows now have symbolic photo_url values (object
--    still-lifes — drum, hands in light, copper bowl, TCM herbs — never
--    fabricated faces). Mirror those onto every `kind='practitioner'` atom
--    that links back to them, so day-card atom rows show the imagery instead
--    of the kind-badge fallback.
--
-- 2. Personal Instagram handles for Krishna and Nina (Pyramids of Chi
--    facilitators) aren't published. Point JourneyGuides at the venue handle
--    @pyramidsofchi as a usable link until they share their personal one.
--
-- Idempotent — only updates where the source value is set and the destination
-- is null.

UPDATE journey_atoms a
SET    image_url = p.photo_url
FROM   practitioners p
WHERE  a.practitioner_id = p.id
  AND  a.kind = 'practitioner'
  AND  a.image_url IS NULL
  AND  p.photo_url IS NOT NULL;

UPDATE practitioners
SET    contact_instagram = '@pyramidsofchi'
WHERE  slug IN ('krishna-pyramids-of-chi', 'nina-pyramids-of-chi')
  AND  contact_instagram IS NULL;
