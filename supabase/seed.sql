-- ============================================
-- The Ubudian — Seed Data
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Inserts: 5 Stories, 10 Events, 5 Tours, 2 Trusted Submitters, 2 Newsletter Editions
-- ============================================

BEGIN;

-- ============================================
-- STORIES (5 published)
-- ============================================

INSERT INTO stories (title, slug, subject_name, subject_tagline, subject_instagram, photo_urls, narrative, theme_tags, status, published_at, meta_title, meta_description)
VALUES
(
  'Wayan Sukerta — The Mask Carver of Mas Village',
  'wayan-sukerta-mask-carver-mas-village',
  'Wayan Sukerta',
  'Third-generation mask carver in Mas Village',
  '@wayansukertamasks',
  ARRAY[
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
    'https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=800',
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800'
  ],
  E'The smell of sandalwood shavings is the first thing you notice when you step into Wayan Sukerta''s workshop in Mas Village. It hangs in the air like incense — warm, woody, ancient. Wayan sits cross-legged on a low platform, a half-finished Barong mask cradled in his lap, his hands moving with the kind of precision that only comes from forty years of practice.\n\n"My grandfather carved masks for the royal court in Ubud," Wayan says, not looking up from his work. His chisel finds the wood with a soft *thunk*. "My father carved for the temples. I carve for everyone — but the prayers are the same."\n\nMas Village, a fifteen-minute drive south of Ubud''s center, has been synonymous with woodcarving for centuries. But the craft is changing. Tourist shops line the main road, filled with mass-produced souvenirs that bear little resemblance to the sacred objects Wayan creates. He doesn''t seem bitter about this. If anything, he sees it as proof that his work matters more than ever.\n\n"A mask is not decoration," he says firmly, finally looking up. His eyes are warm but serious. "A Barong mask protects. A Rangda mask teaches. If you carve without understanding the spirit, you are just making wood into a different shape."\n\nEach of Wayan''s masks takes between two weeks and three months to complete. He begins with a ceremony — offerings of rice, flowers, and holy water placed before the raw log of *pule* wood, the sacred timber traditionally used for Balinese masks. He meditates. He asks permission. Only then does the first cut happen.\n\nThe process is meticulous. Wayan uses over fifty hand tools, most of them inherited from his father. He carves the rough form first, then refines the features over days, checking symmetry by holding the mask against the light. The painting — done with natural pigments mixed with Chinese ink — takes another week. Gold leaf is applied last, pressed on with a fingertip and sealed with a lacquer made from tree resin.\n\n"Young people in Bali want to work with computers," Wayan says with a gentle laugh. "I understand. But I tell them — come sit with me for one afternoon. Feel the wood. Feel what the wood wants to become. That is the real technology."\n\nHis eldest son, Kadek, did sit with him. Now thirty-two, Kadek works alongside his father, learning the sacred forms while quietly experimenting with contemporary designs. Father and son share the workshop in comfortable silence most days, the rhythm of their chisels forming an unspoken conversation.\n\nWayan''s masks have been exhibited at the Neka Art Museum in Ubud and the Indonesian National Museum in Jakarta. A documentary crew from Japan filmed him for three days last year. But he measures success differently.\n\n"When a dancer puts on my Barong mask and the audience feels the spirit enter — *that* is when I know I did my job."',
  ARRAY['Artist', 'Local Legend', 'Craftsperson'],
  'published',
  NOW() - INTERVAL '14 days',
  'Wayan Sukerta — Mask Carver of Mas Village | The Ubudian',
  'Meet Wayan Sukerta, a third-generation mask carver keeping Bali''s sacred woodcarving tradition alive in Mas Village.'
),
(
  'Sarah Chen — From Silicon Valley to Sacred Breath',
  'sarah-chen-silicon-valley-sacred-breath',
  'Sarah Chen',
  'Former tech VP turned breathwork facilitator',
  '@sarahchenbreath',
  ARRAY[
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800'
  ],
  E'Sarah Chen was Vice President of Product at a San Francisco startup valued at $2 billion when she had what she carefully avoids calling a breakdown. "I prefer ''breakthrough,''" she says, tucking her feet beneath her on a daybed overlooking the Campuhan river valley. "Even if it didn''t feel like one at the time."\n\nThe breakthrough came on a Tuesday in March 2019. Sarah was in a board meeting, presenting Q3 projections, when her vision narrowed to a pinpoint and her chest locked up. She couldn''t breathe. She couldn''t speak. She excused herself to the bathroom and sat on the floor for forty-five minutes.\n\n"I''d been running on cortisol and cold brew for seven years," she says. "My body just said *enough*."\n\nA friend suggested she try a retreat in Ubud. Sarah booked two weeks, intending to return to her desk refreshed. That was five years ago.\n\n"The first week, I just slept," she recalls. "The second week, I did a breathwork session with a teacher named Gede. Holotropic breathwork — deep, rhythmic breathing for ninety minutes. I cried through the entire session. I couldn''t stop. And when it ended, I felt like I''d set down a suitcase I''d been carrying since college."\n\nSarah resigned by email that night. She spent the next year studying breathwork in Ubud, India, and Costa Rica. She earned certifications in holotropic breathwork, pranayama, and trauma-informed somatic therapy. In 2021, she opened her own practice in Penestanan, a quiet neighborhood above Ubud.\n\nHer sessions — held in an open-air pavilion surrounded by frangipani trees — draw a mix of locals and visitors. A typical class involves guided breathing exercises, gentle movement, and what Sarah calls "integration time" — space to journal or simply sit with whatever surfaces.\n\n"Breathwork isn''t mystical," she says, practical as ever. "Your nervous system runs on oxygen and carbon dioxide. When you change the ratio deliberately, you access states that your body normally reserves for emergencies or deep sleep. The science is solid."\n\nNot everyone in Ubud''s wellness community appreciates Sarah''s no-nonsense approach. She''s been criticized for being "too clinical" and for declining to incorporate crystals or astrology into her practice. She takes this in stride.\n\n"I spent fifteen years in tech. I know how to read a research paper. I also know how it feels to cry on a bathroom floor because you forgot how to breathe. Both of those things are true at the same time."\n\nSarah now teaches eight classes per week and trains other facilitators through a six-month mentorship program. She hasn''t been back to San Francisco.',
  ARRAY['Healer', 'Expat Life'],
  'published',
  NOW() - INTERVAL '10 days',
  'Sarah Chen — From Silicon Valley to Sacred Breath | The Ubudian',
  'How a tech VP''s panic attack led her to Ubud and a new life as a breathwork facilitator.'
),
(
  'Kadek Ariani — Farming the Future in Tegallalang',
  'kadek-ariani-farming-future-tegallalang',
  'Kadek Ariani',
  'Organic rice farming pioneer near Tegallalang',
  '@kadekariani_organic',
  ARRAY[
    'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800',
    'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=800',
    'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
  ],
  E'Kadek Ariani remembers the exact moment she decided to stop using pesticides. She was standing knee-deep in her family''s rice paddy near Tegallalang, watching a dragonfly hover above the water. "When I was a child, the paddies were full of dragonflies," she says. "That morning I realized I hadn''t seen one in years."\n\nThat was 2016. Today, Kadek''s three-hectare farm is one of the few fully organic rice operations in the Ubud area. Dragonflies are back. So are frogs, water beetles, and a species of freshwater shrimp that her grandfather remembers from his childhood.\n\n"People told me I was crazy," Kadek says, adjusting the wide-brimmed hat that she wears against the equatorial sun. "My uncle said organic rice was for tourists and foreigners. My cousin said I would lose the harvest."\n\nShe did lose the harvest — the first one. Without chemical pesticides, insects devoured nearly forty percent of the crop. Kadek spent that season reading everything she could find about integrated pest management, composting, and the traditional Balinese farming system called *subak*, which coordinates irrigation through a network of water temples.\n\n"The *subak* system is a thousand years old," she explains. "Our ancestors knew how to farm without chemicals. I just had to remember what they knew."\n\nKadek began introducing natural predators — ducks that eat snails, certain wasps that parasitize rice borers. She planted vetiver grass along the paddy edges to filter runoff and provide habitat for beneficial insects. She replaced chemical fertilizer with compost made from rice husks, cow manure, and coconut coir.\n\nThe second harvest was better. The third was nearly equal to her conventional yields. By the fourth year, her organic rice was outperforming the paddies around her.\n\n"Healthy soil grows healthy rice," she says simply. "It takes time for the soil to recover. But once it does, it''s stronger than it was before."\n\nWord spread. Other farmers began visiting Kadek''s paddies, skeptical but curious. She now leads a cooperative of twelve families who have transitioned to organic methods. Together they sell directly to restaurants in Ubud and to a small export company that ships Balinese organic rice to health food stores in Australia and Japan.\n\nKadek also runs farm tours for visitors, explaining the *subak* water temple system and letting guests plant rice by hand. The tours have become one of TripAdvisor''s top-rated experiences in Ubud.\n\n"I want people to understand that rice is not just food," she says, bending to pull a weed from the paddy wall. "In Bali, rice is culture. Rice is ceremony. If we poison the rice, we poison everything."',
  ARRAY['Farmer', 'Environmentalist'],
  'published',
  NOW() - INTERVAL '7 days',
  'Kadek Ariani — Farming the Future in Tegallalang | The Ubudian',
  'Meet the Balinese woman reviving organic rice farming and the ancient subak system near Ubud.'
),
(
  'Marco Rossi — Where Tuscany Meets the Tropics',
  'marco-rossi-tuscany-meets-tropics',
  'Marco Rossi',
  'Italian chef fusing Tuscan and Balinese cuisine',
  '@chefmarcoubud',
  ARRAY[
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800'
  ],
  E'Marco Rossi first came to Bali in 2014 for a friend''s wedding. He was supposed to stay for five days. On the third day, he wandered into a *warung* in Peliatan where a grandmother was making *lawar* — a traditional Balinese dish of minced meat, vegetables, grated coconut, and a complex spice paste. He watched her work for two hours.\n\n"She was doing things with flavor that I had never seen in any European kitchen," Marco says, leaning against the counter of his restaurant, Foglia, on Jalan Hanoman. "The layering of fresh and dried spices, the balance of acid and heat, the way she used the coconut to bind everything — it was as sophisticated as anything in French technique. More sophisticated, actually."\n\nMarco had spent fifteen years in professional kitchens before that moment. He trained at ALMA, the International School of Italian Cuisine in Parma. He worked at a Michelin-starred restaurant in Florence. He ran the kitchen at a boutique hotel in Sardinia. He knew food. But the *lawar* humbled him.\n\n"I went back to Italy, sold my car, packed one bag, and flew back to Bali," he says. "My mother didn''t speak to me for three months."\n\nFor the first two years, Marco apprenticed himself to local cooks. He worked in warungs. He visited markets at dawn with a notebook, sketching unfamiliar ingredients. He learned to make *bumbu* — the aromatic spice pastes that form the foundation of Balinese cooking. He burned his hands learning to roast spices in a clay pot over coconut husk charcoal.\n\nFoglia opened in 2018. The name means "leaf" in Italian — a nod to both the banana leaves used in Balinese cooking and the bay leaves of Tuscan cuisine. The menu is deliberately small: eight dishes that change seasonally, each one a conversation between Italian and Balinese traditions.\n\nHis signature dish is a risotto made with local red rice, slow-cooked with a *base genep* spice paste, finished with aged Parmesan and crispy shallots. It shouldn''t work. It does.\n\n"I am not doing ''fusion,''" Marco says, making air quotes with flour-dusted hands. "Fusion is when you put miso in everything and call it creative. What I am doing is *translation*. I take a Balinese idea and express it through Italian grammar. Or I take an Italian idea and express it with Balinese vocabulary."\n\nFoglia seats thirty-two people. There is no website. Reservations are taken via WhatsApp. The restaurant is fully booked most nights, three weeks in advance. Marco still visits the *warung* in Peliatan every Sunday morning.\n\n"The grandmother — Ibu Ketut — she''s eighty-four now. She still makes the best *lawar* I''ve ever tasted. I bring her Parmesan sometimes. She is not impressed."',
  ARRAY['Chef & Food', 'Expat Life'],
  'published',
  NOW() - INTERVAL '3 days',
  'Marco Rossi — Where Tuscany Meets the Tropics | The Ubudian',
  'An Italian chef''s journey from Michelin kitchens to Balinese warungs, and the restaurant born from both worlds.'
),
(
  'Ni Luh Putu Eka — The Yoga Teacher Who Stayed Home',
  'ni-luh-putu-eka-yoga-teacher-stayed-home',
  'Ni Luh Putu Eka',
  'Balinese yoga teacher breaking barriers',
  '@putuekaayoga',
  ARRAY[
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    'https://images.unsplash.com/photo-1529693662653-9d480530a697?w=800'
  ],
  E'In a town where yoga studios outnumber rice paddies, Ni Luh Putu Eka is an anomaly: a Balinese-born, Balinese-trained yoga teacher who has never left Indonesia. In Ubud''s international wellness scene, where credentials often include training in India, Bali, and California, Eka''s biography is radically local.\n\n"People are surprised," she says, smiling. She''s sitting in the small studio behind her family compound in Keliki, legs folded effortlessly beneath her. "They expect a Balinese yoga teacher to have studied in Rishikesh. But yoga came to Bali long before it came to Rishikesh."\n\nShe''s not wrong. Hindu practices, including forms of meditation and breath control, arrived in Bali with Javanese Hindu kingdoms over a thousand years ago. The island''s priests — *pedanda* — have practiced pranayama-like techniques for centuries, though they don''t call it that.\n\nEka grew up watching her grandfather, a *pedanda*, perform his morning breath practices on the family temple platform. "He would sit for one hour every sunrise," she recalls. "He called it *pranayoga* — union through breath. It was not separate from prayer. It was prayer."\n\nAt sixteen, Eka began studying with her grandfather formally. At twenty, she started teaching local women in her village — an act that raised eyebrows. "Yoga in Bali was traditionally for priests and men," she explains. "A young woman teaching it? My neighbors thought I was confused."\n\nShe taught for free for three years, building a following among Balinese women who had never entered Ubud''s expensive yoga studios. Word reached the Yoga Barn, Ubud''s most prominent studio, and they invited her to teach a weekly class. She''s been teaching there for six years now.\n\nHer classes are distinctive. She teaches in a mix of Bahasa Indonesia and English. She incorporates Balinese mudras and mantras that differ from the Sanskrit forms taught in most Western-style classes. She begins each session with a small offering — a *canang sari* placed at the front of the room.\n\n"I am not trying to prove that Balinese yoga is better," she says carefully. "I am trying to show that it exists. That this island has its own wisdom about the body and the breath. You don''t have to fly to India to find it."\n\nEka now teaches twelve classes per week: six at the Yoga Barn, four in her home studio, and two free community classes in Keliki village. She''s training three young Balinese women as teachers through an informal apprenticeship modeled on how she learned from her grandfather.\n\n"My dream is simple," she says. "I want Balinese people to know that yoga is theirs too. Not just something for tourists. It started here. It lives here."',
  ARRAY['Yogi', 'Local Legend'],
  'published',
  NOW() - INTERVAL '1 day',
  'Ni Luh Putu Eka — The Yoga Teacher Who Stayed Home | The Ubudian',
  'Meet the Balinese yoga teacher proving that Ubud''s deepest wisdom never left the island.'
);

-- ============================================
-- EVENTS (10 approved)
-- ============================================

INSERT INTO events (title, slug, description, short_description, cover_image_url, category, venue_name, venue_address, venue_map_url, start_date, end_date, start_time, end_time, is_recurring, recurrence_rule, price_info, organizer_name, organizer_contact, organizer_instagram, status, submitted_by_email, is_trusted_submitter)
VALUES
(
  'Full Moon Sound Healing Ceremony',
  'full-moon-sound-healing-march-2026',
  E'Join us for a transformative sound healing ceremony under the full moon at The Yoga Barn.\n\n## What to Expect\n\nThis two-hour journey begins with a gentle guided meditation to settle the mind, followed by a full immersion in sound. Our practitioners use:\n\n- **Crystal singing bowls** tuned to the seven chakras\n- **Tibetan brass bowls** over 100 years old\n- **Gongs** — including a 32-inch Paiste symphonic gong\n- **Chimes, rain sticks, and ocean drums**\n\nYou''ll lie comfortably on a mat as waves of sound wash through the space. Many participants report deep relaxation, vivid imagery, and emotional release.\n\n## Practical Details\n\n- Doors open at 6:30 PM for setup\n- Ceremony runs 7:00–9:00 PM\n- Bring your own mat and blanket, or rent from reception (IDR 30,000)\n- Light herbal tea served afterward\n- Space is limited to 60 participants\n\n*"Sound is the bridge between the physical and the spiritual." — Gede Wirawan, Lead Practitioner*',
  'A two-hour sound bath under the full moon with crystal bowls, gongs, and Tibetan singing bowls.',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
  'Yoga & Wellness',
  'The Yoga Barn',
  'Jalan Hanoman, Pengosekan, Ubud, Bali 80571',
  'https://maps.google.com/?q=The+Yoga+Barn+Ubud',
  '2026-03-14',
  NULL,
  '19:00',
  '21:00',
  FALSE,
  NULL,
  'IDR 250,000 (advance) / IDR 300,000 (door)',
  'The Yoga Barn',
  '+62 361 971236',
  '@theyogabarnbali',
  'approved',
  NULL,
  FALSE
),
(
  'Ubud Open Mic Night',
  'ubud-open-mic-night-march-2026',
  E'The longest-running open mic in Ubud returns for another month at Hubud coworking space.\n\n## The Format\n\nSign-up sheet opens at 6:30 PM. Each performer gets **7 minutes** — enough for two songs, a short story, a poem, or whatever you want to share. All genres and art forms welcome. We''ve had everything from stand-up comedy to Balinese folk songs to interpretive dance.\n\n## The Vibe\n\nCasual, supportive, and genuinely welcoming. This is not a competition — it''s a community gathering. First-timers are celebrated. Mistakes are cheered. The only rule: be kind to the person on stage.\n\n## Details\n\n- Full PA system with two microphones\n- Acoustic guitar available (bring your own instrument if you prefer)\n- Food and drinks available from the Hubud café\n- Indoor/outdoor seating\n- Free entry, no purchase required\n\nHosted by longtime Ubud musician Jamie Santos. Come perform, come listen, come connect.',
  'Monthly open mic for music, poetry, comedy, and anything else you want to share.',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
  'Community & Social',
  'Hubud',
  'Jalan Monkey Forest 88X, Ubud, Bali 80571',
  'https://maps.google.com/?q=Hubud+Ubud',
  '2026-03-06',
  NULL,
  '19:00',
  '22:00',
  TRUE,
  'Monthly on the first Friday',
  'Free entry',
  'Jamie Santos',
  '+62 812 3456 7890',
  '@ubudopenmic',
  'approved',
  NULL,
  FALSE
),
(
  'Balinese Painting Workshop at ARMA',
  'balinese-painting-workshop-arma',
  E'Learn the ancient art of Balinese painting in the galleries of the ARMA Museum, surrounded by masterworks from the Ubud and Batuan schools.\n\n## About the Workshop\n\nLed by museum artist-in-residence Wayan Karja, this three-hour session introduces the fundamental techniques of traditional Balinese painting:\n\n1. **Ink drawing** (*ngawi*) — Learn the fine line work that defines Balinese style\n2. **Natural pigment preparation** — Grind and mix pigments from minerals and plants\n3. **Filling and shading** — Traditional techniques for adding depth and color\n4. **Symbolism** — Understand the stories and meanings behind common motifs\n\n## What''s Included\n\n- All materials (canvas, natural pigments, brushes, ink)\n- Museum entry (normally IDR 80,000)\n- Guided gallery tour before the workshop\n- Take home your completed painting\n- Certificate of completion\n\n## Who It''s For\n\nAll skill levels welcome. No previous art experience needed. The workshop is designed for both complete beginners and practicing artists who want to learn Balinese techniques.\n\n*Class size limited to 12 participants for personal attention.*',
  'Three-hour traditional Balinese painting class with museum artist-in-residence Wayan Karja.',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
  'Workshop & Class',
  'ARMA Museum',
  'Jalan Raya Pengosekan, Ubud, Bali 80571',
  'https://maps.google.com/?q=ARMA+Museum+Ubud',
  '2026-03-02',
  NULL,
  '09:00',
  '12:00',
  TRUE,
  'Weekly on Monday',
  'IDR 450,000 per person (all materials included)',
  'ARMA Museum',
  '+62 361 976659',
  '@arabormuseum',
  'approved',
  NULL,
  FALSE
),
(
  'Jazz Night at Bridges Bali',
  'jazz-night-bridges-bali',
  E'Ubud''s premier jazz evening returns every Saturday at Bridges Bali, perched above the Campuhan river gorge.\n\n## The Music\n\nThe **Bridges Jazz Trio** — piano, upright bass, and drums — plays a mix of jazz standards, bossa nova, and original compositions. Guest musicians frequently sit in, making every Saturday unique.\n\nThe trio features:\n- **Agus Setiawan** — piano (Berklee College of Music alumni)\n- **Putu Darmawan** — upright bass\n- **Nyoman Suarta** — drums and percussion\n\n## The Setting\n\nBridges sits on one of Ubud''s most dramatic locations, with floor-to-ceiling windows overlooking the river valley. The jazz starts as the sun sets over the gorge — it''s one of those Ubud moments you won''t forget.\n\n## Dining\n\nFull dinner service available. Bridges is known for its wine list (one of the best in Bali) and its fusion menu. Reservations recommended for dinner seating.\n\n- Music starts at 7:30 PM\n- No cover charge — just order from the menu\n- Smart casual dress code\n- Terrace and indoor seating available',
  'Live jazz trio with dinner overlooking the Campuhan river gorge.',
  'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
  'Music & Live Performance',
  'Bridges Bali',
  'Jalan Raya Campuhan, Ubud, Bali 80571',
  'https://maps.google.com/?q=Bridges+Bali+Ubud',
  '2026-03-07',
  NULL,
  '19:30',
  '22:30',
  TRUE,
  'Weekly on Saturday',
  'No cover charge — order from the menu',
  'Bridges Bali',
  '+62 361 970095',
  '@bridgesbali',
  'approved',
  NULL,
  FALSE
),
(
  'Sunrise Yoga at Campuhan Ridge',
  'sunrise-yoga-campuhan-ridge',
  E'Start your day with yoga on Ubud''s most iconic ridge walk.\n\n## The Experience\n\nMeet at the Campuhan Ridge trailhead at 6:00 AM, just as the sky begins to lighten. We walk five minutes along the ridge to a flat grassy clearing with 360-degree views of the valley and Mount Agung in the distance.\n\nThe 75-minute class is a gentle vinyasa flow designed for the outdoor setting:\n\n- **Sun salutations** facing the actual sunrise\n- **Standing poses** with the valley breeze\n- **Seated stretches** in the morning grass\n- **Final relaxation** as the sun clears the ridge\n\n## Practical Info\n\n- Bring your own mat (or rent one for IDR 20,000)\n- Wear layers — mornings can be cool on the ridge\n- Water and fresh coconut available after class\n- Rain cancellation announced via WhatsApp by 5:30 AM\n- Suitable for all levels including beginners\n\nTaught by **Ni Luh Putu Eka**, one of Ubud''s few Balinese-born yoga teachers, who blends traditional pranayama with modern vinyasa.\n\n*The ridge is magical at dawn. Come once and you''ll be back.*',
  'Outdoor yoga on the famous ridge walk with views of Mount Agung at sunrise.',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
  'Yoga & Wellness',
  'Campuhan Ridge Walk',
  'Jalan Raya Campuhan, Ubud, Bali 80571 (meet at the trailhead near Warwick Ibah)',
  'https://maps.google.com/?q=Campuhan+Ridge+Walk+Ubud',
  '2026-03-04',
  NULL,
  '06:00',
  '07:15',
  TRUE,
  'Twice weekly on Wednesday and Saturday',
  'IDR 100,000 per person',
  'Ni Luh Putu Eka',
  '+62 812 9876 5432',
  '@putuekaayoga',
  'approved',
  NULL,
  FALSE
),
(
  'Ubud Organic Farmers Market',
  'ubud-organic-farmers-market',
  E'The weekly gathering of Ubud''s organic farmers and artisan food producers.\n\n## What You''ll Find\n\n- **Fresh organic produce** — leafy greens, tropical fruits, heirloom tomatoes, mushrooms\n- **Rice varieties** — red, black, and white rice from local organic farms\n- **Artisan bread** — sourdough, ciabatta, and banana bread from three local bakeries\n- **Fermented foods** — kombucha, tempeh, kimchi, coconut kefir\n- **Prepared foods** — smoothie bowls, vegan wraps, nasi campur, fresh juices\n- **Local products** — virgin coconut oil, raw honey, herbal teas, natural skincare\n\n## Community Vibes\n\nThis isn''t just a market — it''s a weekly community meetup. Bring your reusable bags, grab a coffee, and catch up with friends. Local musicians play acoustic sets. Kids run around the courtyard. It''s Ubud at its best.\n\n## Details\n\n- Every Thursday, 8:00 AM – 1:00 PM\n- No entry fee\n- Bring your own bags (limited paper bags available)\n- Parking available on Jalan Goutama\n\n*Organized by the Ubud Organic Farming Cooperative, led by Kadek Ariani.*',
  'Weekly organic produce, artisan food, and community gathering in central Ubud.',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
  'Market & Shopping',
  'Pizza Bagus Courtyard',
  'Jalan Goutama, Ubud, Bali 80571',
  'https://maps.google.com/?q=Pizza+Bagus+Ubud',
  '2026-03-05',
  NULL,
  '08:00',
  '13:00',
  TRUE,
  'Weekly on Thursday',
  'Free entry',
  'Ubud Organic Farming Cooperative',
  '+62 812 5555 1234',
  NULL,
  'approved',
  'sarah@ubudorganic.co',
  TRUE
),
(
  'Film Night at Paradiso — "The Act of Killing"',
  'film-night-paradiso-act-of-killing',
  E'Paradiso Ubud screens one of Indonesia''s most important films in their stunning open-air cinema.\n\n## The Film\n\n**The Act of Killing** (2012, dir. Joshua Oppenheimer) — 159 minutes\n\nThis Academy Award-nominated documentary examines the Indonesian mass killings of 1965–66 through the eyes of the perpetrators. It''s challenging, unforgettable, and essential viewing for anyone wanting to understand Indonesia''s modern history.\n\n*"One of the most important and powerful films made in the last decade." — The Guardian*\n\n## The Venue\n\nParadiso is Ubud''s beloved independent cinema — a converted two-story building with an open-air rooftop screening room, plush beanbags, and a full vegan café. It''s been a cultural anchor in Ubud since 2014.\n\n## Details\n\n- Doors open at 6:30 PM\n- Film starts at 7:00 PM sharp\n- Full food and drink menu available\n- Beanbag seating (first come, first served)\n- Subtitled in English\n\n**Content note:** This film contains disturbing themes. Viewer discretion advised.',
  'Open-air screening of the landmark Indonesian documentary at Ubud''s indie cinema.',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
  'Art & Culture',
  'Paradiso Ubud',
  'Jalan Goutama Selatan, Ubud, Bali 80571',
  'https://maps.google.com/?q=Paradiso+Ubud',
  '2026-03-20',
  NULL,
  '19:00',
  '21:45',
  FALSE,
  NULL,
  'IDR 75,000 (includes a drink)',
  'Paradiso Ubud',
  '+62 361 897 6540',
  '@paradiso.ubud',
  'approved',
  NULL,
  FALSE
),
(
  'Raw Food Masterclass at Alchemy',
  'raw-food-masterclass-alchemy',
  E'Learn the art of raw food preparation from the team behind Ubud''s most famous plant-based restaurant.\n\n## What You''ll Make\n\n1. **Raw pad thai** with kelp noodles, almond sauce, and fresh herbs\n2. **Activated nut cheese** — cashew-based with herbs and dehydrated crackers\n3. **Chocolate avocado mousse** with raw cacao, coconut cream, and local honey\n\n## What You''ll Learn\n\n- Dehydration techniques for crackers and wraps\n- Nut activation and sprouting\n- Flavor building without cooking\n- Raw food nutrition basics\n- Equipment essentials for a home raw kitchen\n\n## Details\n\n- 3-hour hands-on class (10:00 AM – 1:00 PM)\n- All ingredients and equipment provided\n- Recipe booklet to take home\n- Eat everything you make for lunch\n- Maximum 10 participants\n- Suitable for all dietary needs (can adapt for nut-free)\n\n*Alchemy has been Ubud''s raw food pioneer since 2011. Their kitchen team has trained over 5,000 students.*',
  'Hands-on raw food cooking class: pad thai, nut cheese, and chocolate mousse.',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  'Food & Drink',
  'Alchemy Ubud',
  'Jalan Penestanan Kelod 75, Ubud, Bali 80571',
  'https://maps.google.com/?q=Alchemy+Ubud',
  '2026-03-15',
  NULL,
  '10:00',
  '13:00',
  FALSE,
  NULL,
  'IDR 550,000 per person (all materials + lunch)',
  'Alchemy Bali',
  '+62 812 3800 1234',
  '@alikiebali',
  'approved',
  'events@alchemybali.com',
  FALSE
),
(
  'Ogoh-Ogoh Parade — Nyepi Eve',
  'ogoh-ogoh-parade-nyepi-eve-2026',
  E'Witness one of Bali''s most spectacular cultural events as giant papier-mâché monsters parade through the streets of Ubud on the eve of Nyepi (Day of Silence).\n\n## What Are Ogoh-Ogoh?\n\nOgoh-ogoh are massive demon statues — some over five meters tall — built by communities across Bali in the weeks before Nyepi. They represent *bhuta kala* (negative forces) that are symbolically expelled through the parade.\n\nEach *banjar* (neighborhood) builds their own ogoh-ogoh, and the competition is fierce. The artistry is extraordinary — these are built from bamboo, styrofoam, and papier-mâché, then painted in vivid detail.\n\n## The Parade\n\nThe procession begins at Ubud Palace and winds through the main streets. Each ogoh-ogoh is carried by dozens of young men who spin and shake the statue at crossroads (to confuse evil spirits). The atmosphere is electric — gamelan orchestras play, crowds cheer, and the night sky glows with torchlight.\n\n## Important Notes\n\n- The parade starts around 6:00 PM but timing is approximate\n- Find a viewing spot early — Jalan Raya Ubud fills up fast\n- This is a sacred ceremony — be respectful (no touching the statues)\n- The following day (Nyepi) is the Day of Silence: no travel, no lights, no activities\n- Airport closes for 24 hours on Nyepi\n\n**This is a once-a-year event. If you are in Ubud, do not miss it.**',
  'Giant demon statues parade through Ubud on the eve of Nyepi, Bali''s Day of Silence.',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'Art & Culture',
  'Ubud Palace (Puri Saren Agung)',
  'Jalan Raya Ubud, Ubud, Bali 80571',
  'https://maps.google.com/?q=Ubud+Palace',
  '2026-03-19',
  NULL,
  '18:00',
  '22:00',
  FALSE,
  NULL,
  'Free (public event)',
  'Ubud Village Council',
  NULL,
  NULL,
  'approved',
  NULL,
  FALSE
),
(
  'Community River Cleanup — Wos River',
  'community-river-cleanup-wos-river',
  E'Join the biweekly volunteer cleanup of the Wos River, one of Ubud''s most important waterways.\n\n## Why It Matters\n\nThe Wos River runs through the heart of Ubud, feeding rice paddies and flowing into sacred bathing sites downstream. Plastic pollution from upstream development threatens the ecosystem and the communities that depend on it.\n\nSince starting in 2023, this volunteer effort has removed over **12 tons** of waste from the river and its banks.\n\n## What to Expect\n\n- Meet at the Wos River Bridge (Jalan Raya Ubud side) at 7:00 AM\n- Gloves, bags, and grabbers provided\n- Teams work upstream and downstream for 2.5 hours\n- Sorted waste is tracked and recorded for environmental data\n- Free breakfast provided afterward at a local warung\n\n## Bring\n\n- Closed-toe shoes that can get wet\n- Sun protection (hat, sunscreen)\n- Water bottle\n- A positive attitude\n\n## All Welcome\n\nNo experience needed. Families welcome (children must be accompanied). We''ve had volunteers from over 30 countries.\n\n*Organized by Sungai Watch Ubud Chapter and supported by the local banjar.*',
  'Biweekly volunteer cleanup of the Wos River — all ages and experience levels welcome.',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
  'Community & Social',
  'Wos River Bridge',
  'Jalan Raya Ubud (bridge near Kafe restaurant), Ubud, Bali 80571',
  'https://maps.google.com/?q=Wos+River+Ubud',
  '2026-03-08',
  NULL,
  '07:00',
  '09:30',
  TRUE,
  'Biweekly on Sunday',
  'Free (volunteer event)',
  'Sungai Watch Ubud',
  '+62 813 7777 8888',
  '@sungaiwatch',
  'approved',
  NULL,
  FALSE
);

-- ============================================
-- TOURS (5 active)
-- ============================================

INSERT INTO tours (title, slug, description, short_description, photo_urls, itinerary, duration, price_per_person, max_group_size, theme, whats_included, what_to_bring, guide_name, booking_whatsapp, booking_email, is_active)
VALUES
(
  'Sacred Water Temples & Rice Terraces',
  'sacred-water-temples-rice-terraces',
  E'A full-day journey through Bali''s most sacred water temples and the iconic rice terraces of the Ubud highlands.\n\nThis tour connects three of Bali''s holiest water sites — places where the Balinese come to purify body and spirit — with the breathtaking rice terrace landscapes that make the Ubud area famous worldwide.\n\nYour guide, Made Wijaya, is a lifelong resident of Tampaksiring whose family has served as temple guardians for three generations. He offers insights into Balinese Hinduism, water temple rituals, and the *subak* irrigation system (a UNESCO World Heritage cultural landscape) that you won''t find in any guidebook.\n\nThis is not a bus tour. We travel in a private car, stopping frequently to walk, explore, and absorb the landscape at a human pace. Lunch is at a family-run *warung* overlooking the terraces — no tourist restaurants.',
  'Full-day journey through holy water temples and UNESCO rice terraces with a local temple guardian.',
  ARRAY[
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
    'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    'https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=800'
  ],
  E'## Itinerary\n\n**7:30 AM** — Pickup from your hotel in the Ubud area\n\n**8:30 AM** — **Tirta Empul Temple** (Tampaksiring)\nBali''s holiest water temple, founded in 962 AD. Walk through the purification pools and learn the rituals. Optional: participate in the *melukat* (purification) ceremony with Made''s guidance.\n\n**10:30 AM** — **Gunung Kawi Royal Tombs**\nDescend 300 steps into a river valley to reach 11th-century rock-cut shrines carved into the cliff face. One of Bali''s most atmospheric sites.\n\n**12:00 PM** — **Lunch** at a family warung in Tegallalang\nAuthentic Balinese home cooking overlooking the rice terraces. Dishes include nasi campur, lawar, and fresh tropical fruit.\n\n**1:30 PM** — **Tegallalang Rice Terraces**\nWalk through the famous terraces with Made explaining the *subak* cooperative irrigation system. Visit a small coffee plantation to see (and taste) Balinese coffee processing.\n\n**3:00 PM** — **Tirta Gangga Water Palace** (Karangasem)\nA stunning royal water garden built in 1946, with ornamental pools, fountains, and stone sculptures. Swim in the spring-fed pools.\n\n**4:30 PM** — Return drive to Ubud (arrive approximately 5:30 PM)',
  '8-9 hours',
  850000,
  6,
  'Spiritual & Healing',
  E'- Private car with air conditioning\n- English-speaking guide (Made Wijaya)\n- All temple entrance fees\n- Sarong and sash rental for temple visits\n- Authentic Balinese lunch\n- Bottled water throughout the day\n- Coffee and tea tasting\n- Hotel pickup and drop-off (Ubud area)',
  E'- Comfortable walking shoes (300+ steps at Gunung Kawi)\n- Swimwear (for Tirta Gangga pools)\n- Sunscreen and hat\n- Camera\n- Light rain jacket (highland weather can change quickly)\n- Cash for personal purchases',
  'Made Wijaya',
  '+62 812 3456 7001',
  'tours@theubudian.com',
  TRUE
),
(
  'Ubud Food Trail',
  'ubud-food-trail',
  E'Eat your way through Ubud''s best warungs, markets, and hidden kitchens on this half-day culinary adventure.\n\nUbud''s food scene is extraordinary — but the best meals are rarely in the places tourists find on their own. This tour takes you behind the scenes, into family kitchens and market stalls, where generations of cooks prepare dishes you won''t find on any restaurant menu.\n\nYour guide, Wayan Sudiarta, is a Ubud-born food writer who has spent twenty years documenting Balinese culinary traditions. He knows every *warung* owner by name and every dish by story.\n\nExpect to eat a *lot*. We visit six food stops over five hours. Come hungry, leave happy.',
  'Half-day walking food tour through Ubud''s best warungs, markets, and hidden kitchens.',
  ARRAY[
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'
  ],
  E'## Itinerary\n\n**8:00 AM** — **Ubud Traditional Market**\nMeet at the market''s eastern entrance. Wayan introduces you to the vendors: the spice lady who''s been here for forty years, the *jaja* (traditional cake) stall, the flower sellers. Taste seasonal fruits and fresh *jamu* (herbal tonic).\n\n**9:00 AM** — **Warung Biah Biah**\nA tiny family warung hidden down an alley in Ubud center. Famous for their *nasi campur* (mixed rice plate) and *lawar* (minced meat with spiced coconut). This is what Balinese people actually eat.\n\n**10:00 AM** — **Ibu Oka**\nThe legendary *babi guling* (suckling pig) spot. Even if you''ve been before, Wayan''s stories about the owner and the preparation process reveal a whole new layer.\n\n**10:45 AM** — **Coffee Break** at Seniman Coffee Studio\nUbud''s best specialty coffee roaster. Learn about Indonesian coffee varieties while sipping a perfectly pulled espresso.\n\n**11:30 AM** — **Warung Tepi Sawah**\nLunch overlooking rice paddies. Wayan pre-orders dishes you can''t get off the regular menu — including a traditional *megibung* (communal feast) preparation.\n\n**12:30 PM** — **Dessert at Bali Buda**\nFinish with raw chocolate truffles and cold-pressed juice. Wayan shares his favorite Ubud food secrets for the rest of your trip.\n\n**1:00 PM** — Tour ends in central Ubud',
  '5 hours',
  500000,
  8,
  'Food & Culinary',
  E'- All food tastings at six stops (8+ dishes)\n- Coffee at Seniman\n- Bottled water throughout\n- English-speaking food guide (Wayan Sudiarta)\n- Market tour and cultural context\n- Printed map of Wayan''s personal Ubud food recommendations',
  E'- Comfortable walking shoes\n- An empty stomach\n- Cash for any additional purchases\n- Water bottle (refills provided)\n- Sense of adventure for unfamiliar foods',
  'Wayan Sudiarta',
  '+62 813 5678 9002',
  'tours@theubudian.com',
  TRUE
),
(
  'Campuhan to Sayan Artists'' Ridge Walk',
  'campuhan-sayan-artists-ridge-walk',
  E'A guided art-and-nature walk along the ridges that inspired generations of Ubud''s most celebrated artists.\n\nThe Campuhan Ridge and the Sayan valley beyond it have drawn painters, writers, and musicians since the 1930s, when Walter Spies and Rudolf Bonnet established Ubud as Bali''s artistic capital. This walk follows their footsteps — literally — along paths they used to reach their studios and the villages that inspired their work.\n\nYour guide, Agung Rai, is an art historian and the founder of the ARMA Museum. He brings decades of knowledge about the artists who lived and worked along this route, from the European pioneers to the Balinese masters of the Ubud and Young Artists schools.\n\nThis is a gentle walk, not a hike. The pace is slow, with frequent stops for stories, sketching (materials provided), and simply taking in the views.',
  'Guided art history walk along the ridges that inspired Ubud''s greatest painters.',
  ARRAY[
    'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=800'
  ],
  E'## Itinerary\n\n**7:00 AM** — **Campuhan Ridge Trailhead**\nMeet at the Gunung Lebah temple entrance. Agung sets the scene: how the Campuhan river confluence became sacred, and why Walter Spies built his home on this exact ridge in 1937.\n\n**7:30 AM** — **Ridge Walk**\nWalk the famous grassy ridge with 360-degree views. Agung points out the locations of former artists'' studios, including Spies'' house (now part of Hotel Tjampuhan) and Antonio Blanco''s hilltop estate.\n\n**8:30 AM** — **Penestanan Village**\nDescend into the village where the "Young Artists" movement began in the 1960s. Visit a local painter''s home studio and see works in progress.\n\n**9:30 AM** — **Sketching Break**\nStop at a scenic overlook above the Sayan valley. Agung leads a 30-minute observational drawing exercise. All materials provided — no skill needed, just open eyes.\n\n**10:00 AM** — **Sayan Ridge**\nContinue to the Sayan ridge, where Colin McPhee wrote *A House in Bali* (1946) and the Amandari resort now perches above the Ayung river gorge.\n\n**10:30 AM** — **Morning Tea**\nConclude at a riverside café in Sayan with tea and traditional *jaja* cakes. Agung shares book and film recommendations for further exploration.\n\n**11:00 AM** — Tour ends (transport back to central Ubud provided)',
  '4 hours',
  350000,
  10,
  'Art & Craft',
  E'- Expert art historian guide (Agung Rai)\n- Sketching materials (notebook, pencils, eraser)\n- Morning tea and traditional cakes\n- Transport back to central Ubud\n- Printed walking map with art history notes',
  E'- Comfortable walking shoes (some uneven paths)\n- Sun protection (hat, sunscreen)\n- Water bottle\n- Camera\n- Light layer for early morning',
  'Agung Rai',
  '+62 812 9012 3003',
  'tours@theubudian.com',
  TRUE
),
(
  'Hidden Waterfalls & Jungle Trek',
  'hidden-waterfalls-jungle-trek',
  E'Escape the crowds and discover three hidden waterfalls deep in the jungle north of Ubud.\n\nBali has hundreds of waterfalls, but the most beautiful ones require a guide who knows the unmarked trails. This full-day trek takes you through dense tropical jungle, across rivers, and behind cascading falls that most visitors never see.\n\nYour guide, Ketut Arya, grew up in a farming village on the edge of the jungle. He''s been exploring these trails since childhood and knows every path, every river crossing, and every hidden swimming hole.\n\nThis is a moderately challenging trek — expect steep descents, river crossings (sometimes knee-deep), and jungle paths. The reward: pristine waterfalls with no one else around.',
  'Full-day jungle trek to three hidden waterfalls north of Ubud with river crossings and swimming.',
  ARRAY[
    'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800',
    'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  ],
  E'## Itinerary\n\n**7:00 AM** — Pickup from your hotel in Ubud\n\n**8:00 AM** — **Trailhead** (Kintamani area)\nBrief safety talk and trail overview. The trek begins on a village path through clove and coffee plantations.\n\n**9:00 AM** — **First Waterfall — Sumampan**\nA 15-meter cascade into a turquoise pool surrounded by mossy rocks. Swimming stop (30 minutes).\n\n**10:30 AM** — **Jungle Trail**\nThe real adventure begins. We leave the main path and follow a river upstream through dense tropical forest. Ketut points out medicinal plants, bird species, and animal tracks.\n\n**11:30 AM** — **Second Waterfall — Kanto Lampo Hidden**\nNot the famous Kanto Lampo — this is its secret upstream cousin. A curtain of water over a smooth rock face, perfect for standing beneath.\n\n**12:30 PM** — **Jungle Lunch**\nPicnic lunch on a riverside clearing. Balinese *nasi bungkus* (rice wrapped in banana leaf), fresh fruit, and hot tea prepared by Ketut over a small fire.\n\n**1:30 PM** — **Third Waterfall — Blangsinga Secret**\nThe grand finale: a 25-meter waterfall crashing into a deep pool carved out of black volcanic rock. Swimming and cliff-jumping (optional, 3-meter jump) for the adventurous.\n\n**3:00 PM** — **Return Trek**\nDifferent route back, through rice terraces and a small village where Ketut''s family offers fresh coconuts.\n\n**4:00 PM** — Return drive to Ubud (arrive approximately 5:00 PM)',
  '7-8 hours',
  600000,
  6,
  'Nature & Rice Terraces',
  E'- Private transport with air conditioning\n- English-speaking jungle guide (Ketut Arya)\n- Picnic lunch and snacks\n- Bottled water (2L per person)\n- Dry bag for electronics\n- Basic first aid kit\n- Hotel pickup and drop-off (Ubud area)',
  E'- Sturdy hiking shoes or sandals with grip (not flip-flops)\n- Swimwear (worn under clothes)\n- Quick-dry clothing\n- Towel\n- Sunscreen and insect repellent\n- Waterproof phone case (recommended)\n- Change of dry clothes for the ride home',
  'Ketut Arya',
  '+62 813 4567 8004',
  'tours@theubudian.com',
  TRUE
),
(
  'Ubud Heritage Walk',
  'ubud-heritage-walk',
  E'Discover the cultural heart of Ubud on this walking tour through the town''s most significant temples, palaces, and historic neighborhoods.\n\nUbud is more than yoga studios and smoothie bowls. Before the tourists came, this was a town of royalty, priests, and artists — and that heritage is still alive in every temple, compound, and ceremony you''ll encounter on this walk.\n\nYour guide, Cokorda Raka, is a member of Ubud''s royal family and a cultural historian. He opens doors — sometimes literally — that are closed to the general public, offering perspectives on Balinese culture that go far deeper than any guidebook.\n\nThe walk is entirely flat and moves at a conversational pace. We stop frequently for cultural context, architectural details, and the occasional offering ceremony that happens to be in progress.',
  'Walking tour through Ubud''s temples, palaces, and historic neighborhoods with a royal family guide.',
  ARRAY[
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
    'https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=800'
  ],
  E'## Itinerary\n\n**8:00 AM** — **Ubud Palace (Puri Saren Agung)**\nMeet at the palace gates. Cokorda — whose family has lived here for centuries — takes you inside the *jaba tengah* (middle courtyard) and explains the architecture of a Balinese royal compound.\n\n**8:45 AM** — **Ubud Traditional Market**\nCross the street to the morning market at its busiest. Cokorda explains the role of the market in Balinese social life and points out offerings and ceremonial supplies.\n\n**9:15 AM** — **Pura Taman Saraswati** (Lotus Temple)\nThe famous lotus pond temple, built by master artist I Gusti Nyoman Lempad. Cokorda decodes the stone carvings and explains the significance of Saraswati (goddess of knowledge and arts).\n\n**9:45 AM** — **Lempad''s House**\nVisit the former home of Ubud''s most famous artist, now a small museum. Cokorda shares personal stories — Lempad was a close associate of his grandfather.\n\n**10:15 AM** — **Jalan Kajeng Street Art Walk**\nWalk down Ubud''s most charming street, lined with painted tiles created by local artists. Each tile tells a story.\n\n**10:45 AM** — **Pura Gunung Lebah** (Campuhan Temple)\nUbud''s oldest temple, at the sacred confluence of two rivers. Cokorda explains the concept of *campuhan* (meeting point) in Balinese cosmology.\n\n**11:15 AM** — **Morning Tea at Murni''s Warung**\nConclude at Ubud''s oldest restaurant, perched above the Campuhan gorge. Tea and conversation with Cokorda about modern Ubud and its future.\n\n**12:00 PM** — Tour ends',
  '4 hours',
  400000,
  8,
  'Cultural & Heritage',
  E'- Royal family guide (Cokorda Raka)\n- Temple entrance fees (where applicable)\n- Sarong and sash for temple visits\n- Morning tea and snacks at Murni''s\n- Printed cultural heritage map of Ubud\n- Small offering set for temple participation',
  E'- Comfortable walking shoes\n- Respectful clothing (shoulders and knees covered — sarongs provided for temples)\n- Sun protection (hat, sunscreen)\n- Water bottle\n- Camera\n- Cash for market purchases if desired',
  'Cokorda Raka',
  '+62 812 7890 1005',
  'tours@theubudian.com',
  TRUE
);

-- ============================================
-- TRUSTED SUBMITTERS (2)
-- ============================================

INSERT INTO trusted_submitters (email, approved_count, auto_approve)
VALUES
  ('sarah@ubudorganic.co', 5, TRUE),
  ('events@alchemybali.com', 3, FALSE);

-- ============================================
-- NEWSLETTER EDITIONS (2 published)
-- References stories via featured_story_id
-- ============================================

INSERT INTO newsletter_editions (subject, slug, preview_text, featured_story_id, content_json, status, sent_at)
VALUES
(
  'The Ubudian Weekly — The Mask Carver''s Secret',
  'weekly-mask-carvers-secret',
  'Meet Wayan Sukerta, Mas Village''s third-generation mask carver. Plus: Full Moon Sound Healing, the farmers market returns, and your guide to Nyepi.',
  (SELECT id FROM stories WHERE slug = 'wayan-sukerta-mask-carver-mas-village'),
  '{
    "featured_story_excerpt": "## Meet Wayan Sukerta\n\nThe smell of sandalwood shavings is the first thing you notice when you step into Wayan Sukerta''s workshop in Mas Village. It hangs in the air like incense — warm, woody, ancient.\n\n*\"A mask is not decoration. A Barong mask protects. A Rangda mask teaches. If you carve without understanding the spirit, you are just making wood into a different shape.\"*\n\nWayan is a third-generation mask carver whose work has been exhibited at the Neka Art Museum and the Indonesian National Museum in Jakarta. But he measures success differently: *\"When a dancer puts on my Barong mask and the audience feels the spirit enter — that is when I know I did my job.\"*\n\n[Read the full story →](/stories/wayan-sukerta-mask-carver-mas-village)",
    "weekly_flow": "## What''s Happening This Week\n\n**Full Moon Sound Healing** — Saturday, March 14 at The Yoga Barn. Two hours of crystal bowls, gongs, and Tibetan singing bowls under the full moon. IDR 250,000 advance / IDR 300,000 at the door. Space for 60 — book early.\n\n**Open Mic Night** — Friday, March 6 at Hubud. Sign up at the door. Seven minutes to share whatever you''ve got — music, poetry, comedy, or something we haven''t thought of yet. Free entry.\n\n**Organic Farmers Market** — Thursday at Pizza Bagus Courtyard. Fresh produce, artisan bread, kombucha, and Kadek Ariani''s organic rice. 8 AM – 1 PM. Bring your own bags.\n\n**Jazz Night** — Saturday at Bridges Bali. The trio plays from 7:30 PM overlooking the gorge. No cover charge.\n\n**Sunrise Yoga** — Wednesday and Saturday at Campuhan Ridge. 6:00 AM with Putu Eka. IDR 100,000. Bring a mat or rent one.",
    "community_bulletin": "## Community Bulletin\n\n**River Cleanup Volunteers Needed** — The biweekly Wos River cleanup is this Sunday at 7 AM. Gloves and bags provided, free breakfast afterward. Over 12 tons of waste removed since 2023. Show up and help.\n\n**ARMA Painting Workshops** — Every Monday, 9 AM – 12 PM. Learn traditional Balinese painting with museum artist-in-residence Wayan Karja. IDR 450,000 including all materials and museum entry.\n\n**Paradiso Film Night** — March 20: \"The Act of Killing.\" Essential viewing if you want to understand Indonesian history. Doors 6:30 PM, film 7:00 PM. IDR 75,000 with a drink.",
    "cultural_moment": "## Cultural Moment: Canang Sari\n\nYou see them everywhere in Ubud — small palm-leaf trays filled with flowers, rice, incense, and sometimes a cracker or candy, placed on the ground, on steps, on dashboards. These are **canang sari**, daily offerings that are the foundation of Balinese Hindu practice.\n\nEach element has meaning:\n- The tray (*canang*) is woven from young coconut leaves\n- **White flowers** (east) represent Iswara\n- **Red flowers** (south) represent Brahma\n- **Yellow flowers** (west) represent Mahadeva\n- **Blue or green flowers** (north) represent Vishnu\n- **Incense** carries the prayer upward\n\nCanang sari are placed three times daily — morning, midday, and evening. They are expressions of gratitude (*suksma*) to Sang Hyang Widhi Wasa (God) for the balance of good in the world.\n\n**Etiquette tip:** Never step on a canang sari. If you accidentally do, it''s not a disaster — just be mindful. The Balinese understand that visitors are learning.",
    "weekly_question": "What brought you to Ubud, and what made you stay?",
    "weekly_question_responses": "## Your Responses\n\n*\"I came for a yoga retreat in 2019. I stayed because on my third morning, I was walking through the rice paddies and a farmer stopped me to share his lunch. No one had ever done that for me in fifteen years of living in London.\"* — **Emma, UK (now 5 years in Ubud)**\n\n*\"A friend told me the wifi was good and the coffee was cheap. Both true. But what kept me was the creative energy. Everyone here is making something — art, food, music, businesses. It''s contagious.\"* — **Tomas, Czech Republic (2 years)**\n\n*\"I''m Balinese. I left for university in Jakarta and came back because Ubud is where my family''s temple is. The offerings and ceremonies — that''s what holds everything together. Without that, Ubud is just another tourist town.\"* — **Wayan, Ubud local**",
    "tour_spotlight_text": "## Tour Spotlight: Sacred Water Temples & Rice Terraces\n\nA full day with Made Wijaya, a third-generation temple guardian, through Bali''s holiest water sites and the UNESCO rice terraces. Tirta Empul, Gunung Kawi, Tegallalang, and Tirta Gangga — with stories you won''t hear from anyone else.\n\nIDR 850,000 per person. Max 6 people. Private car, all entrance fees, and an authentic Balinese lunch included.\n\n[View full tour details →](/tours/sacred-water-temples-rice-terraces)"
  }'::jsonb,
  'published',
  NOW() - INTERVAL '7 days'
),
(
  'The Ubudian Weekly — Nyepi Is Coming',
  'weekly-nyepi-is-coming',
  'Everything you need to know about Nyepi (Day of Silence), the Ogoh-Ogoh parade, and why Bali goes completely dark for 24 hours.',
  (SELECT id FROM stories WHERE slug = 'ni-luh-putu-eka-yoga-teacher-stayed-home'),
  '{
    "featured_story_excerpt": "## Meet Ni Luh Putu Eka\n\nIn a town where yoga studios outnumber rice paddies, Ni Luh Putu Eka is an anomaly: a Balinese-born, Balinese-trained yoga teacher who has never left Indonesia.\n\n*\"People are surprised. They expect a Balinese yoga teacher to have studied in Rishikesh. But yoga came to Bali long before it came to Rishikesh.\"*\n\nEka grew up watching her grandfather — a *pedanda* (high priest) — practice breath work at sunrise every morning. Now she teaches twelve classes per week, including free community sessions in her home village of Keliki.\n\n*\"My dream is simple. I want Balinese people to know that yoga is theirs too. Not just something for tourists. It started here. It lives here.\"*\n\n[Read the full story →](/stories/ni-luh-putu-eka-yoga-teacher-stayed-home)",
    "weekly_flow": "## What''s Happening This Week\n\n**Ogoh-Ogoh Parade** — Thursday, March 19 at Ubud Palace. The night before Nyepi. Giant demon statues paraded through the streets by torchlight. Starts around 6 PM. Free. **Do not miss this.**\n\n**Nyepi (Day of Silence)** — Friday, March 20. The entire island shuts down for 24 hours. No travel, no lights, no noise, no activity. Airport closed. Stay in your accommodation and enjoy the most profound silence you''ve ever experienced.\n\n**Raw Food Masterclass** — Sunday, March 15 at Alchemy. Learn to make raw pad thai, nut cheese, and chocolate mousse. IDR 550,000, 10 AM – 1 PM.\n\n**Film Night at Paradiso** — Friday, March 20 (post-Nyepi). \"The Act of Killing\" — the documentary everyone in Bali should see. IDR 75,000.\n\n**Jazz at Bridges** — Saturday at 7:30 PM. The trio plays. No cover. Wine list worth the visit alone.",
    "community_bulletin": "## Community Bulletin\n\n**Nyepi Prep Reminder** — Stock up on groceries and water by Wednesday evening. Nothing will be open from Thursday night through Saturday morning. ATMs will not be accessible. Your accommodation will provide meals — confirm with your host.\n\n**River Cleanup** — This Sunday at 7 AM at the Wos River bridge. Last chance before Nyepi. Bring closed-toe shoes.\n\n**ARMA Workshop** — Monday, 9 AM. Balinese painting with Wayan Karja. IDR 450,000 all-inclusive. A perfect pre-Nyepi contemplative activity.",
    "cultural_moment": "## Cultural Moment: Understanding Nyepi\n\n**Nyepi** (Day of Silence) is the Balinese Hindu New Year — and it is unlike any other New Year celebration on earth. Instead of fireworks and parties, the entire island of Bali goes completely silent for 24 hours.\n\n### The Four Prohibitions of Nyepi\n\n1. **Amati Geni** — No fire or light (including screens)\n2. **Amati Karya** — No work or activity\n3. **Amati Lelungan** — No travel\n4. **Amati Lelanguan** — No entertainment\n\n### Why Silence?\n\nThe concept is beautiful: the island pretends to be empty. Demons and evil spirits (*bhuta kala*) — expelled the night before by the Ogoh-Ogoh parade — fly overhead looking for humans to torment. Finding only darkness and silence, they conclude Bali is uninhabited and leave.\n\nFor visitors, Nyepi offers something increasingly rare in modern life: a full day with nowhere to go, nothing to do, and no screens. Many people find it profoundly restful. Read a book. Sleep. Watch the stars — with no light pollution, the Milky Way is visible from central Ubud.\n\n**Practical notes:** The airport closes for 24 hours. Hotels provide meals. *Pecalang* (traditional security) patrol the streets to enforce silence. Breaking Nyepi is a serious offense — be respectful.",
    "weekly_question": "What is the most memorable ceremony or cultural event you have witnessed in Bali?",
    "weekly_question_responses": "## Your Responses\n\n*\"My first Nyepi. I was terrified of being bored. Instead I sat on my balcony and cried — good tears. I hadn''t sat still in twenty years. The silence was like medicine.\"* — **Alison, Australia**\n\n*\"A cremation ceremony in Pejeng. Hundreds of people, a massive bull sarcophagus, gamelan music for hours. My neighbor explained that they were happy — sending their loved one home. It completely changed how I think about death.\"* — **David, Canada (3 years in Ubud)**\n\n*\"Every morning at my family temple. My mother makes canang sari before sunrise. She has done this every single day for fifty years. That is the most important ceremony — the one nobody photographs.\"* — **Ketut, Ubud local**",
    "tour_spotlight_text": "## Tour Spotlight: Ubud Heritage Walk\n\nExperience Ubud''s cultural heart with Cokorda Raka, a member of the royal family. Walk through the palace, the lotus temple, Lempad''s house, and Ubud''s oldest temple — with stories from someone whose family has lived here for centuries.\n\nIDR 400,000 per person. Max 8 people. Sarong, temple fees, and morning tea at Murni''s Warung included.\n\n[View full tour details →](/tours/ubud-heritage-walk)"
  }'::jsonb,
  'published',
  NOW() - INTERVAL '1 day'
);

COMMIT;
