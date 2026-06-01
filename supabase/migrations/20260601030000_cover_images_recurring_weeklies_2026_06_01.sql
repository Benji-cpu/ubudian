-- Cover images for image-less backbone weeklies — 2026-06-01
-- Six recurring events rendered the editorial gradient placeholder. Generated
-- brand-tonal documentary covers (Stability AI Core, editorial/NatGeo register —
-- natural light, deep-green/sand/gold palette, no chakra/new-age motifs),
-- visually reviewed each, uploaded to the `images` bucket. Match by slug, only
-- where still null (idempotent).
UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/1780299159817-qxb8q52dhos.png', updated_at = now()
WHERE slug = 'core-moksa-dojo-jam-monday' AND cover_image_url IS NULL;

UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/1780299189636-9dot52r91av.png', updated_at = now()
WHERE slug = 'core-moksa-dojo-contact-class-friday' AND cover_image_url IS NULL;

UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/1780299200062-s11i6vcymmi.png', updated_at = now()
WHERE slug = 'solo-improvisation-w-nastya-mogksigx' AND cover_image_url IS NULL;

UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/1780299210493-w2g6d8tm6yc.png', updated_at = now()
WHERE slug = 'd-xperience' AND cover_image_url IS NULL;

UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/1780299222163-jykowbajtlf.png', updated_at = now()
WHERE slug = 'kirtan-mantra-medicine-sacred-cacao' AND cover_image_url IS NULL;

UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/1780299231284-fnzfsp602c6.png', updated_at = now()
WHERE slug = 'sunday-kirtan-with-vasudev' AND cover_image_url IS NULL;
