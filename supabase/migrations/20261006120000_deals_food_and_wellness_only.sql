-- Deals: food, cafés, breakfast and wellness only, at a fair price (Ben, 6 Oct 2026).
-- The Ubudian's reader mostly doesn't drink, so drink-led deals come off; so do
-- deals over IDR 200k a person. Rows are hidden, never deleted, and the note
-- shows to the venue on /venue. Proposal: Code/handovers/2026-10-06-deals-direction-proposal.md
-- Expected: 34 + 5 rows hidden, 1 row retitled; 9 deals stay live.

update specials set status = 'hidden',
  review_note = 'Not listed: The Ubudian lists food, café and wellness deals, not drink offers.',
  updated_at = now()
where status = 'live' and id in (
  '9366ccd7-17a4-4345-807c-bf1ae2d86f48', -- Beer Brothers: Two beers for the price of one
  '74c6b444-ef5f-417c-bd9d-a3359bdb2845', -- Cantina Rooftop: Sundown Sundays: 2-for-1 cocktails
  'a576b436-20d9-4a64-ae42-129d394c54ff', -- Casa Luna: 2-for-1 cocktails
  'e2b8c9c4-fcb7-4cfe-a282-4f6dd958134e', -- Copper Kitchen & Rooftop: Happy hour
  '09f752a4-8e2c-4454-a5d4-1601a568e5fc', -- CP Lounge: Buy 2 cocktails, get the 3rd free
  '0d3fcb36-4f8b-4589-974f-d91656716099', -- Folk Pool & Gardens: Pay 1, get 2 cocktails
  'a2f14304-454b-4b26-8d38-2f966ebe9836', -- Habitat Bistro: Buy 1, get 1 cocktails with a canapé
  '0ee88ba2-a915-40fb-a831-b7b6ede99a6f', -- Ibu Susu: Happy hour cocktails
  'a25062e5-1330-46fb-89b0-1b3a20f19c6a', -- Indus: Two cocktails
  'c9e59985-0adc-4d6a-b594-24a3242bfc28', -- Kafe Batan Waru: 2-for-1 lychee martinis
  '11f19775-aaa5-4a83-a340-05977ef1ff4c', -- Kakiang Bakery & Cafe: Four small Singaraja beers
  'e6485ddb-2e02-4799-b6a5-7886bf38e511', -- Kemangi: 2+1 cocktails
  '555b6a8f-0bc9-44f9-afad-7b0b69ab96aa', -- Kemangi: Beer bucket with chicken satay
  'c5d27477-66ee-4b6b-a0b5-939b25feac35', -- Kepitu (The Kayon Resort): Ladies' night: free welcome cocktail
  '48c0f3b1-25d8-4042-b994-b1ae5a504bdd', -- Laughing Buddha Bar: 2-for-1 classic cocktails
  '75b76449-6e85-4ec7-ab0f-bdc53ea5cc5a', -- Lokal Bar: Free welcome arak shot
  'e2aab186-6cf7-4caf-9e51-fb5cea6dd7d8', -- Lokal Bar: Pay 2, get 3 cocktails
  '6369084e-2aed-4ed1-a239-9f6ac346a1e3', -- Melali: Buy 2 glasses of wine, get 1 free
  '6da5852c-2d78-41b5-acc5-77ee010df5bf', -- Melali: Sundowner: cocktail and bites
  '2b2a3731-c085-46ba-b777-39e28b2c5625', -- Melali: GINtastic Thursday
  '97408cc9-2118-4a87-9804-1f18a57a4fae', -- No Más: Happy hour: five cocktails
  '4a7ddd54-fcb7-4ffe-93fa-3ba82475f658', -- Oops Restaurant & Bar: 2-for-1 mojitos
  '97b8c010-9954-4ce4-83de-b153fca2e7a7', -- Sayan Valley: Second drink free
  'a050221e-c4b8-43af-b99c-046eac89cf7e', -- The Blue Door: Ladies' night
  '20483519-d9ba-48b8-ba99-020b665f43bf', -- The Blue Door: Happy hour
  '614e113a-5e45-4a9a-b782-6d3b1caec542', -- The Blue Door: Espetada & wine
  'a0fe1f06-1cff-400c-9aa7-ea5f70661abd', -- The Blue Door: Pizza & beer
  '7a8fd052-03be-470c-9524-2c5239d66086', -- The Blue Door: Burger & beer
  '9fc1ff52-abb2-4e84-ae2e-0c7f69658816', -- The Blue Door: Pasta & wine
  'b9ce52b7-e944-4106-beb5-43e505906fe0', -- The Blue Door: Chicken & a free beer
  'aab8d47c-2bd3-4dbe-aeab-2b0d046b3791', -- The Blue Door: Happy hour
  'ffe0d4bb-614b-4ff2-a2f5-0d72d760ae59', -- The Blue Door: Steak & wine
  '58fbb17b-77ce-46f2-bef5-7b39887d57c2', -- Toro Dining: Buy 2 cocktails, get 1 free
  '35f28e5e-ef8c-4fa5-8635-a6f41059654a' -- Why Not: 2-for-1 happy hour
);

update specials set status = 'hidden',
  review_note = 'Not listed: we list deals at IDR 200k a person or less.',
  updated_at = now()
where status = 'live' and id in (
  '401661b7-f688-4973-bcbe-34edc6b54e29', -- CasCades (Viceroy Bali): Afternoon tea: under-6s free, 6–11 half price
  '318720aa-6fdf-4360-b19c-30b2bbe57b7a', -- Honey & Smoke: Early bird: five dishes from the fire
  '527a2263-72e2-4477-9f45-f29cd189ad31', -- Kraton by K Club: All you can eat
  '6b214b70-01a3-4beb-814f-4575a8d93cd7', -- Uma Cucina (COMO Uma Ubud): Sunday brunch, all you can eat
  'a50cf3cb-e890-4953-80d6-0ec506b419c7' -- Wapa di Ume: BBQ dinner and Barong dance: kids half price
);

-- The floating breakfast is the draw; lead with it.
update specials set title = 'Breakfast set, or float it in the pool',
  description = 'Breakfast set IDR 200k; add IDR 100k to have it served floating in the pool.',
  updated_at = now()
where id::text like '37c8d3a9%' and venue_name = 'Habitat Bistro';
