-- Fix: the original seed used HTML entities (&rsquo;, &ldquo;, &rdquo;) which
-- the markdown→HTML pipeline did not decode at render time, so they showed as
-- literal text on /experiences. Replace with unicode characters in every
-- journey text column.

UPDATE journeys SET
  subtitle        = replace(replace(replace(coalesce(subtitle, ''),        '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  hero_quote      = replace(replace(replace(coalesce(hero_quote, ''),      '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  summary         = replace(replace(replace(coalesce(summary, ''),         '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  whats_included  = replace(replace(replace(coalesce(whats_included, ''),  '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  who_its_for     = replace(replace(replace(coalesce(who_its_for, ''),     '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  practical_info  = replace(replace(replace(coalesce(practical_info, ''),  '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”')
WHERE  subtitle       LIKE '%&rsquo;%' OR subtitle       LIKE '%&ldquo;%' OR subtitle       LIKE '%&rdquo;%'
   OR  hero_quote     LIKE '%&rsquo;%' OR hero_quote     LIKE '%&ldquo;%' OR hero_quote     LIKE '%&rdquo;%'
   OR  summary        LIKE '%&rsquo;%' OR summary        LIKE '%&ldquo;%' OR summary        LIKE '%&rdquo;%'
   OR  whats_included LIKE '%&rsquo;%' OR whats_included LIKE '%&ldquo;%' OR whats_included LIKE '%&rdquo;%'
   OR  who_its_for    LIKE '%&rsquo;%' OR who_its_for    LIKE '%&ldquo;%' OR who_its_for    LIKE '%&rdquo;%'
   OR  practical_info LIKE '%&rsquo;%' OR practical_info LIKE '%&ldquo;%' OR practical_info LIKE '%&rdquo;%';

UPDATE journey_days SET
  theme          = replace(replace(replace(coalesce(theme, ''),          '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  theme_subtitle = replace(replace(replace(coalesce(theme_subtitle, ''), '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  intention      = replace(replace(replace(coalesce(intention, ''),      '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”')
WHERE  theme          LIKE '%&rsquo;%' OR theme          LIKE '%&ldquo;%' OR theme          LIKE '%&rdquo;%'
   OR  theme_subtitle LIKE '%&rsquo;%' OR theme_subtitle LIKE '%&ldquo;%' OR theme_subtitle LIKE '%&rdquo;%'
   OR  intention      LIKE '%&rsquo;%' OR intention      LIKE '%&ldquo;%' OR intention      LIKE '%&rdquo;%';

UPDATE journey_atoms SET
  title             = replace(replace(replace(coalesce(title, ''),             '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  description       = replace(replace(replace(coalesce(description, ''),       '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”'),
  short_description = replace(replace(replace(coalesce(short_description, ''), '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”')
WHERE  title             LIKE '%&rsquo;%' OR title             LIKE '%&ldquo;%' OR title             LIKE '%&rdquo;%'
   OR  description       LIKE '%&rsquo;%' OR description       LIKE '%&ldquo;%' OR description       LIKE '%&rdquo;%'
   OR  short_description LIKE '%&rsquo;%' OR short_description LIKE '%&ldquo;%' OR short_description LIKE '%&rdquo;%';

UPDATE journey_day_slots SET
  prompt = replace(replace(replace(coalesce(prompt, ''), '&rsquo;', '’'), '&ldquo;', '“'), '&rdquo;', '”')
WHERE  prompt LIKE '%&rsquo;%' OR prompt LIKE '%&ldquo;%' OR prompt LIKE '%&rdquo;%';
