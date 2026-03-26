-- Brand Realignment: Re-categorize events to new category system
-- Old categories removed: Food & Drink, Market & Shopping, Sports & Adventure, Kids & Family, Workshop & Class
-- Old categories renamed: Yoga & Wellness → Yoga & Meditation, Music & Live Performance → Music & Performance, Community & Social → Circle & Community
-- New categories added: Dance & Movement, Tantra & Intimacy, Ceremony & Sound, Healing & Bodywork, Retreat & Training

-- Re-categorize specific approved events
UPDATE events SET category = 'Tantra & Intimacy'
WHERE title ILIKE '%Living Tantra Retreat%' AND status = 'approved';

UPDATE events SET category = 'Tantra & Intimacy'
WHERE title = 'SUNDAY WORSHIP' AND status = 'approved';

UPDATE events SET category = 'Tantra & Intimacy'
WHERE title ILIKE '%The Art of Safe Connection%' AND status = 'approved'
AND title NOT ILIKE '%Retreat%';

UPDATE events SET category = 'Tantra & Intimacy'
WHERE title ILIKE '%Deeper Intimacy%Liquid Love Temple%' AND status = 'approved';

UPDATE events SET category = 'Retreat & Training'
WHERE title ILIKE '%TANTRIC SHADOW EMPOWERMENT%' AND status = 'approved';

UPDATE events SET category = 'Tantra & Intimacy'
WHERE title ILIKE '%Embodied Tantra Level 1%' AND status = 'approved';

UPDATE events SET category = 'Retreat & Training'
WHERE title ILIKE '%Tantric Chakra Physiology%' AND status = 'approved';

UPDATE events SET category = 'Healing & Bodywork'
WHERE title ILIKE '%Tachyon Vertical Reality%' AND status = 'approved';

-- Re-categorize specific pending events
UPDATE events SET category = 'Tantra & Intimacy'
WHERE title ILIKE '%Embodied Tantra%Tantric Taster%' AND status = 'pending';

UPDATE events SET category = 'Tantra & Intimacy'
WHERE title ILIKE '%Alchemy of Her%' AND status = 'pending';

UPDATE events SET category = 'Tantra & Intimacy'
WHERE title = 'Sunday Worship' AND status = 'pending';

UPDATE events SET category = 'Retreat & Training'
WHERE title ILIKE '%The Art of Safe Connection%Somatic Tantra Retreat%' AND status = 'pending';

-- Bulk-rename any remaining old categories
UPDATE events SET category = 'Yoga & Meditation' WHERE category = 'Yoga & Wellness';
UPDATE events SET category = 'Music & Performance' WHERE category = 'Music & Live Performance';
UPDATE events SET category = 'Circle & Community' WHERE category = 'Community & Social';
UPDATE events SET category = 'Retreat & Training' WHERE category = 'Workshop & Class';
