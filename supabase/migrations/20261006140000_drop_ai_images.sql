-- Image audit, 6 Oct 2026 (Code/handovers/ubudian-deals-tools/image-audit-2026-10-06.md).
-- Ben's rule: where there is no real photo, show no image (a plain colour block), never another AI one.
-- Data only: columns are set to NULL, no row is deleted and no file leaves storage.
-- Every consumer already renders a block or initials when the image is NULL.

-- Guides: banknotes that aren't rupiah; wine-glass hero and wedding-party card; wrong offering and dress.
UPDATE guides SET card_image_url = NULL WHERE slug = 'money-in-bali' AND card_image_url LIKE '%/covers/money-card.jpg';
UPDATE guides SET hero_image_url = NULL, card_image_url = NULL
  WHERE slug = 'falling-in-love-in-ubud'
    AND (hero_image_url LIKE '%/covers/falling-in-love-hero.jpg' OR card_image_url LIKE '%/covers/falling-in-love-card.jpg');
UPDATE guides SET hero_image_url = NULL, card_image_url = NULL
  WHERE slug = 'local-culture-honestly'
    AND (hero_image_url LIKE '%/covers/local-culture-hero.jpg' OR card_image_url LIKE '%/covers/local-culture-card.jpg');

-- Practitioners: AI still-lifes standing in for real named people. Cards fall back to initials.
UPDATE practitioners SET hero_image_url = NULL WHERE hero_image_url LIKE '%-practitioner-%.png';
UPDATE practitioners SET photo_url = NULL WHERE photo_url LIKE '%-practitioner-%.png';

-- Day-plan stops: images that aren't the place they are labelled as, and the 4 practitioner slots.
UPDATE journey_atoms SET image_url = NULL, image_credit = NULL, image_credit_url = NULL
  WHERE image_url LIKE '%-atom-tirta-empul.png' OR image_url LIKE '%-atom-campuhan-ridge.png' OR image_url LIKE '%-practitioner-%.png';

-- Paradiso weekly events: one AI image of bare feet, eight times, 3.7 MB each.
UPDATE events SET cover_image_url = NULL WHERE slug LIKE 'paradiso-%' AND cover_image_url LIKE '%-mow7%.png';
