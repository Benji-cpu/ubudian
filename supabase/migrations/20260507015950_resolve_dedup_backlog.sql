-- Manual dedup backlog resolution (2026-05-07).
-- 13 false positives: Bachata classes flagged by fuzzy_title but represent distinct
-- skill levels (Beg/Inter/Adv) on the same day at Ubud Studio. Mark not_dup.
-- 3 real duplicates: Ecstatic Dance (4-25), Somatics Dance Movement (4-18),
-- Embodied Tantra (3-21). Mark confirmed_dup. For the only one where both
-- events are still 'approved', archive the duplicate (event_b) too.

-- False positives (different class levels) ---------------------------------
update public.dedup_matches
   set status      = 'not_dup',
       resolved_at = now(),
       resolved_by = null  -- system/maintenance resolution, no admin user
 where id in (
   'e2a0010b-76d1-4ce2-9cce-7066141c6ffa',  -- Bachata Inter ↔ Adv (4-30)
   'd22b8e0e-db74-41ba-bc45-1e0bb910dd63',  -- Bachata Beg ↔ Adv  (4-30)
   '99de719b-85f1-439d-aee5-a31db115bc12',  -- Bachata Inter ↔ Beg (4-30)
   'cca5176c-5327-4ddf-93a4-2968882cec32',  -- Bachata Inter ↔ Beg (4-28)
   '5d0430d0-eccf-4472-b266-84072fcafd1b',  -- Bachata Inter ↔ Beg (4-23)
   'bc67ce83-c83a-4dd3-a39c-8f0fc56321a7',  -- Salsa On1 ↔ Salsa On2 (different syllabi)
   '2ea91bf9-1f7e-4eb9-af0e-7cfb19cf6020',  -- Bachata Adv ↔ Inter (4-16)
   '8228782f-f77a-44ab-b827-8b19e4fd1afe',  -- Bachata Beg ↔ Adv  (4-16)
   'bc449729-359f-45eb-bcf7-72a330ac5eb5',  -- Bachata Beg ↔ Inter (4-16)
   'e5a91fd8-896c-4808-83d7-a18d6661b04f',  -- Bachata Inter ↔ Beg (4-9)
   'bfc686ab-abdb-4d43-8858-ab26b6497dcd',  -- Bachata Inter ↔ Beg (4-7)
   '5e48505c-4949-4704-a987-800f2d11f4a3',  -- Bachata Beg ↔ Inter (3-24)
   'f64e832d-9eb1-4afe-91fa-d87b40a9f8e7'   -- Bachata Inter ↔ Beg (3-26)
 );

-- Confirmed duplicates -----------------------------------------------------
update public.dedup_matches
   set status      = 'confirmed_dup',
       resolved_at = now()
 where id in (
   'a63f8c72-ad9a-49d6-99bf-26bc209bad0b',  -- Ecstatic Dance 4-25 (same time, same venue)
   '4623f03b-6d25-4e81-8119-7fd4e9af1c44',  -- Somatic(s) Dance Movement 4-18 (already archived)
   'd998eb48-e6c1-49db-aed9-eef9f7bc69e7'   -- Embodied Tantra 3-21 (already archived)
 );

-- Archive the still-live duplicate event for Ecstatic Dance ----------------
update public.events
   set status     = 'archived',
       updated_at = now()
 where id = '5ed9fc8b-903a-44a6-9ea8-ff20e615f49a';  -- "Ecstatic Dance with Live Mantras" — keeping 128bb595 ("Ecstatic Dance journey with Live mantras")
