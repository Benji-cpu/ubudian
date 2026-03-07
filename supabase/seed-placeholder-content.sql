-- Seed: Placeholder content for The Ubudian
-- All content is marked with is_placeholder = true for easy cleanup
-- Dates are set relative to "now" so content stays fresh

-- ============================================
-- EVENTS (18 events, status: approved)
-- ============================================

-- Seeker events
INSERT INTO events (title, slug, description, short_description, category, venue_name, venue_address, start_date, end_date, start_time, end_time, is_recurring, price_info, organizer_name, status, is_placeholder, archetype_tags) VALUES
('Morning Vinyasa at The Yoga Barn', 'morning-vinyasa-yoga-barn', 'Start your day with a flowing vinyasa practice at Ubud''s most iconic yoga studio. This 90-minute class moves through sun salutations, standing poses, and deep stretches, set in an open-air shala surrounded by tropical gardens. All levels welcome — props provided. Arrive 10 minutes early to settle in.', 'Flowing vinyasa in an open-air shala surrounded by tropical gardens.', 'Yoga & Wellness', 'The Yoga Barn', 'Jl. Hanoman, Pengosekan, Ubud', CURRENT_DATE + INTERVAL '3 days', NULL, '07:00', '08:30', true, '150,000 IDR', 'The Yoga Barn', 'approved', true, ARRAY['seeker']),

('Full Moon Water Purification at Tirta Empul', 'full-moon-water-purification-tirta-empul', 'Join a guided melukat (spiritual cleansing) ceremony at the sacred Tirta Empul temple during the full moon. A Balinese priest will lead you through the ancient purification fountains while explaining the spiritual significance of each spring. Sarong and sash provided. This is a real ceremony, not a tourist photo op — please come with respect and intention.', 'Sacred water purification ceremony guided by a Balinese priest.', 'Yoga & Wellness', 'Tirta Empul Temple', 'Tampaksiring, Gianyar', CURRENT_DATE + INTERVAL '7 days', NULL, '08:00', '11:00', false, '350,000 IDR (includes offerings & guide)', 'Sacred Bali Journeys', 'approved', true, ARRAY['seeker']),

('Sound Bath Ceremony at Pyramids of Chi', 'sound-bath-ceremony-pyramids-chi', 'Lie back inside a pyramid structure and let Tibetan singing bowls, crystal bowls, gongs, and chimes wash over you. The 75-minute sound bath at Pyramids of Chi is designed to shift your brainwaves into deep theta states — participants often report vivid visions, emotional release, and profound relaxation. Mats and bolsters provided.', 'Deep relaxation sound bath inside a pyramid structure.', 'Yoga & Wellness', 'Pyramids of Chi', 'Jl. Bypass Tanah Lot, Ubud', CURRENT_DATE + INTERVAL '5 days', NULL, '19:30', '20:45', true, '250,000 IDR', 'Pyramids of Chi', 'approved', true, ARRAY['seeker']),

('Shamanic Breathwork & Cacao Ceremony', 'shamanic-breathwork-cacao-ceremony', 'Begin with a cup of ceremonial-grade Balinese cacao, then journey inward through guided holotropic breathwork. This 2-hour session combines ancient shamanic practices with modern breathwork techniques, held in a beautiful bamboo pavilion overlooking the Campuhan river valley. Limited to 20 participants for an intimate experience.', 'Ceremonial cacao followed by guided breathwork in a bamboo pavilion.', 'Yoga & Wellness', 'Fivelements Retreat', 'Banjar Baturning, Mambal', CURRENT_DATE + INTERVAL '10 days', NULL, '16:00', '18:00', false, '450,000 IDR', 'Heart Space Bali', 'approved', true, ARRAY['seeker']),

-- Explorer events
('Sunrise Trek to Mount Batur', 'sunrise-trek-mount-batur', 'Depart Ubud at 2am for the 2-hour trek to the summit of Mount Batur (1,717m), arriving just in time to watch the sun rise over Mount Agung and the caldera lake below. Your local guide will prepare breakfast eggs cooked in volcanic steam at the top. Return via the black lava fields and finish with a soak in natural hot springs.', 'Trek an active volcano by moonlight and watch sunrise from the summit.', 'Sports & Adventure', 'Mount Batur', 'Kintamani, Bangli', CURRENT_DATE + INTERVAL '4 days', NULL, '02:00', '11:00', false, '650,000 IDR (includes transport, guide, breakfast)', 'Batur Sunrise Trekking', 'approved', true, ARRAY['explorer']),

('Downhill Cycling: Volcano to Rice Terraces', 'downhill-cycling-volcano-rice-terraces', 'Coast 30km downhill from the Kintamani volcanic highlands through traditional Balinese villages, coffee plantations, and terraced rice paddies. Stop to visit a family compound, taste luwak coffee, and watch a woodcarving demonstration. The route ends in Ubud with lunch at a local warung overlooking the Tegallalang rice terraces.', 'Cycle 30km downhill through villages, coffee plantations, and rice paddies.', 'Sports & Adventure', 'Kintamani to Ubud', 'Pick-up from your hotel', CURRENT_DATE + INTERVAL '6 days', NULL, '08:00', '14:00', false, '500,000 IDR (includes bike, helmet, lunch)', 'Green Bike Ubud', 'approved', true, ARRAY['explorer']),

('Ayung River White Water Rafting', 'ayung-river-white-water-rafting', 'Navigate 10km of Class II-III rapids through a dramatic jungle gorge carved by the Ayung River. The 2-hour rafting adventure passes ancient stone carvings, towering waterfalls, and dense tropical forest. No experience needed — professional guides handle the serious stuff while you enjoy the ride. Includes buffet lunch at the finish point.', 'Navigate jungle gorge rapids past waterfalls and ancient stone carvings.', 'Sports & Adventure', 'Ayung River', 'Payangan, Ubud', CURRENT_DATE + INTERVAL '8 days', NULL, '09:00', '13:00', false, '450,000 IDR (includes equipment & lunch)', 'Ubud Rafting Adventures', 'approved', true, ARRAY['explorer']),

('Tukad Cepung Waterfall Guided Hike', 'tukad-cepung-waterfall-guided-hike', 'Descend through a narrow canyon into a hidden cave where sunlight filters through the rock ceiling, illuminating the Tukad Cepung waterfall in ethereal beams. Your guide will take you on the less-traveled trail, bypassing crowds and stopping at rice terraces and a local coffee farmer''s home along the way. Bring water shoes.', 'Hike through a canyon to a hidden cave waterfall with ethereal light beams.', 'Sports & Adventure', 'Tukad Cepung Waterfall', 'Bangli Regency', CURRENT_DATE + INTERVAL '9 days', NULL, '07:30', '12:00', false, '300,000 IDR (includes guide & transport)', 'Ubud Nature Walks', 'approved', true, ARRAY['explorer']),

-- Creative events
('Legong Dance Performance at Ubud Palace', 'legong-dance-ubud-palace', 'Watch the ethereal Legong dance performed by Ubud''s finest dancers in the candlelit courtyard of Puri Saren Agung (Ubud Royal Palace). The 90-minute performance tells the story of a king''s dream through intricate eye movements, precise finger positions, and shimmering gold costumes. One of Bali''s oldest and most refined dance forms.', 'Classical Balinese dance in the candlelit courtyard of the Royal Palace.', 'Art & Culture', 'Ubud Royal Palace (Puri Saren Agung)', 'Jl. Raya Ubud', CURRENT_DATE + INTERVAL '2 days', NULL, '19:30', '21:00', true, '100,000 IDR', 'Ubud Palace Cultural Foundation', 'approved', true, ARRAY['creative']),

('Kecak Fire Dance at Padang Tegal', 'kecak-fire-dance-padang-tegal', 'No instruments — just the hypnotic chanting of 100 men in concentric circles, firelight flickering across their faces as they tell the story of the Ramayana. The Kecak fire dance is Bali''s most dramatic performance, and when the fire dancer walks barefoot across burning coconut husks, you''ll understand why people call it unforgettable.', 'A hundred voices chanting in firelight — Bali''s most dramatic performance.', 'Art & Culture', 'Padang Tegal Stage', 'Jl. Hanoman, Ubud', CURRENT_DATE + INTERVAL '3 days', NULL, '19:00', '20:00', true, '80,000 IDR', 'Padang Tegal Community', 'approved', true, ARRAY['creative']),

('Batuan-Style Painting Workshop', 'batuan-style-painting-workshop', 'Learn the centuries-old Batuan painting tradition with a master artist in his family studio. Using natural pigments and fine bamboo pens, you''ll create a detailed miniature painting of Balinese mythology. The 3-hour workshop includes art history, technique demonstration, and guided creation. Take your finished painting home as a one-of-a-kind souvenir.', 'Create a traditional Batuan painting with a master artist in his family studio.', 'Workshop & Class', 'Batuan Village', 'Batuan, Sukawati, Gianyar', CURRENT_DATE + INTERVAL '5 days', NULL, '09:00', '12:00', false, '400,000 IDR (includes materials)', 'I Made Budi Studio', 'approved', true, ARRAY['creative']),

('Silver Jewelry Workshop in Celuk', 'silver-jewelry-workshop-celuk', 'Design and craft your own silver ring or pendant under the guidance of a fourth-generation Celuk silversmith. Learn traditional Balinese silver techniques including filigree, granulation, and stone setting. The 4-hour workshop takes you from raw silver sheet to a polished, wearable piece of art. All materials and tools provided.', 'Craft your own silver jewelry with a fourth-generation Balinese silversmith.', 'Workshop & Class', 'Celuk Silver Village', 'Celuk, Sukawati, Gianyar', CURRENT_DATE + INTERVAL '11 days', NULL, '09:00', '13:00', false, '550,000 IDR (includes silver materials)', 'Celuk Silver Collective', 'approved', true, ARRAY['creative']),

('Gamelan Performance & Workshop at ARMA', 'gamelan-performance-workshop-arma', 'Experience the mesmerizing bronze percussion of a full Balinese gamelan orchestra, then try your hand at playing the instruments yourself. ARMA Museum''s resident musicians perform a 45-minute concert followed by a hands-on workshop where you''ll learn basic techniques on the gender, reyong, and kendang. No musical experience needed.', 'Watch a gamelan concert, then learn to play the instruments yourself.', 'Music & Live Performance', 'ARMA Museum', 'Jl. Raya Pengosekan, Ubud', CURRENT_DATE + INTERVAL '6 days', NULL, '15:00', '17:00', false, '200,000 IDR (includes museum entry)', 'ARMA Museum', 'approved', true, ARRAY['creative']),

-- Connector events
('Long Table Community Dinner', 'long-table-community-dinner', 'Sit down with 30 strangers at a long communal table in a torchlit rice field and leave with 30 new friends. The monthly community dinner features a 5-course Balinese-fusion menu prepared by local chefs, free-flowing conversation, and no assigned seating (that''s the point). Past tables have included surf instructors, tech founders, healers, farmers, and everyone in between.', 'A 5-course dinner with 30 strangers in a torchlit rice field.', 'Community & Social', 'The Rice Field Collective', 'Tegallalang, Ubud', CURRENT_DATE + INTERVAL '12 days', NULL, '18:30', '22:00', false, '350,000 IDR (includes 5-course dinner)', 'Ubud Community Collective', 'approved', true, ARRAY['connector']),

('Digital Nomad Meetup at Outpost', 'digital-nomad-meetup-outpost', 'The weekly Thursday meetup for Ubud''s remote work community. Casual networking over drinks and snacks at Outpost coworking space — no formal agenda, just good conversations with fellow location-independent professionals. Regular attendees include freelancers, startup founders, content creators, and anyone working remotely from Bali. First drink free for newcomers.', 'Weekly casual networking for Ubud''s remote work community.', 'Community & Social', 'Outpost Coworking', 'Jl. Raya Penestanan Kelod, Ubud', CURRENT_DATE + INTERVAL '1 day', NULL, '17:00', '20:00', true, 'Free (drinks at own expense)', 'Ubud Digital Nomads', 'approved', true, ARRAY['connector']),

('Ubud Art Market Walking Tour', 'ubud-art-market-walking-tour', 'Go beyond the tourist stalls with a local guide who knows every artisan by name. This 2-hour walking tour of the Ubud Art Market takes you behind the scenes to meet woodcarvers, batik makers, and basket weavers, hear their stories, and learn to spot quality handmade goods. You''ll never look at a souvenir market the same way again.', 'Meet the artisans behind the stalls on a guided market walkthrough.', 'Market & Shopping', 'Ubud Art Market', 'Jl. Raya Ubud', CURRENT_DATE + INTERVAL '4 days', NULL, '08:00', '10:00', false, '200,000 IDR', 'Walk Ubud', 'approved', true, ARRAY['connector', 'creative']),

-- Epicurean events
('Balinese Cooking Class at Taman Dukuh', 'balinese-cooking-class-taman-dukuh', 'Begin at the Ubud morning market selecting fresh ingredients with your chef-guide, then head to a traditional family compound to cook a full Balinese feast. Over 5 hours, you''ll prepare 9 dishes including lawar, sate lilit, and bebek betutu, learning the spice pastes and techniques that define Balinese cuisine. Finish by eating everything you made at a communal table.', 'Market-to-table cooking experience: shop, cook 9 dishes, and feast together.', 'Food & Drink', 'Taman Dukuh Cooking School', 'Tegallalang, Ubud', CURRENT_DATE + INTERVAL '5 days', NULL, '08:00', '13:00', false, '450,000 IDR (includes market tour & all ingredients)', 'Taman Dukuh', 'approved', true, ARRAY['epicurean']),

('Gianyar Night Market Food Tour', 'gianyar-night-market-food-tour', 'Ubud''s best-kept food secret is 30 minutes away. The Gianyar Night Market is where locals go for babi guling (suckling pig), nasi jinggo, martabak, and dozens of other Balinese street foods you won''t find on tourist menus. Your local guide will navigate the bustling market, order the best dishes, and explain the stories behind each one. Come hungry.', 'Eat your way through the night market locals love — guided by a local foodie.', 'Food & Drink', 'Gianyar Night Market', 'Jl. Ngurah Rai, Gianyar', CURRENT_DATE + INTERVAL '7 days', NULL, '17:30', '20:30', false, '300,000 IDR (includes 6-8 tastings)', 'Bali Food Safari', 'approved', true, ARRAY['epicurean']);

-- ============================================
-- TOURS (10 tours, is_active: true)
-- ============================================

INSERT INTO tours (title, slug, description, short_description, photo_urls, duration, price_per_person, max_group_size, theme, guide_name, is_active, is_placeholder, archetype_tags) VALUES
('Sacred Temple Journey', 'sacred-temple-journey', 'Visit three of Bali''s most spiritually significant temples in a single day: Tirta Empul for water purification, Gunung Kawi for ancient royal tombs carved into riverside cliffs, and Goa Gajah (Elephant Cave) for meditation in a 9th-century hermitage. Your guide is a practicing Hindu who will explain the living spiritual traditions at each site. Includes offerings, sarong, and traditional Balinese lunch.', 'Three sacred temples with a practicing Hindu guide.', ARRAY['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop'], '8 hours', 850000, 6, 'Spiritual & Healing', 'Wayan Dharma', true, true, ARRAY['seeker']),

('Tegallalang Rice Terrace Trek', 'tegallalang-rice-terrace-trek', 'Skip the viewpoint selfie and actually walk through the UNESCO-recognized subak irrigation system that has sustained Balinese agriculture for 1,000 years. This 4-hour trek follows ancient water channels through cascading rice terraces, with stops to meet farmers, learn about the communal irrigation philosophy, and cool off with fresh coconut water under a banyan tree.', 'Walk through the ancient subak irrigation system with a local farmer.', ARRAY['https://images.unsplash.com/photo-1531592937781-2a5768714e8e?w=800&h=600&fit=crop'], '4 hours', 450000, 8, 'Nature & Rice Terraces', 'Ketut Sumantra', true, true, ARRAY['explorer']),

('Ubud Art Village Full Day', 'ubud-art-village-full-day', 'Each village around Ubud specializes in a different art form. This full-day tour visits the painters of Batuan, the woodcarvers of Mas, the silversmiths of Celuk, and the stone carvers of Batubulan, with studio visits and demonstrations at each stop. End the day with a private viewing at the Neka Art Museum. A crash course in 500 years of Balinese art history, told by the artists themselves.', 'Visit four artisan villages and meet the masters of Balinese craft.', ARRAY['https://images.unsplash.com/photo-1558005137-d9619a5c539f?w=800&h=600&fit=crop'], '9 hours', 950000, 6, 'Art & Craft', 'Nyoman Artawan', true, true, ARRAY['creative']),

('Waterfall Photography Tour', 'waterfall-photography-tour', 'Chase waterfalls (literally) with a professional photographer guide who knows the secret angles and golden-hour timing at four of Ubud''s most photogenic cascades. Visit Tegenungan, Kanto Lampo, Tukad Cepung, and Tibumana, learning composition and long-exposure techniques at each. Includes a post-tour editing session at a Ubud cafe. Bring your camera or shoot on phone — both work.', 'Four waterfalls, pro photography tips, and a post-tour editing session.', ARRAY['https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&h=600&fit=crop'], '7 hours', 750000, 4, 'Photography', 'Sarah Blackwell', true, true, ARRAY['explorer', 'creative']),

('Cultural Immersion: Village Life', 'cultural-immersion-village-life', 'Spend a full day living like a Balinese villager in Penglipuran, one of Bali''s cleanest and most traditional villages. Join morning offerings, learn to weave bamboo, help prepare a traditional feast, and participate in a community meeting. Your host family has been welcoming guests for three generations — you''ll be treated as family, not a tourist.', 'Live as a local for a day in a traditional Balinese village.', ARRAY['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&h=600&fit=crop'], '10 hours', 1100000, 4, 'Cultural & Heritage', 'I Wayan Sudiarsa', true, true, ARRAY['connector']),

('Sunrise Volcano & Hot Springs', 'sunrise-volcano-hot-springs', 'The classic Bali adventure: ascend Mount Batur by headlamp, summit for sunrise above the clouds, cook breakfast in volcanic steam, then descend to natural hot springs on the shore of the caldera lake. Includes hotel pickup from Ubud at 2am, all equipment, guide, and breakfast. The pre-dawn start is worth it — this is a sunrise you''ll remember for the rest of your life.', 'Summit Mount Batur for sunrise, then soak in volcanic hot springs.', ARRAY['https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800&h=600&fit=crop'], '10 hours', 750000, 10, 'Adventure & Trekking', 'Made Batur Guides', true, true, ARRAY['explorer']),

('Ubud Food & Market Tour', 'ubud-food-market-tour', 'Follow your nose through Ubud''s bustling morning market, tasting street snacks and learning to identify tropical fruits you''ve never seen before. Then visit a local warung kitchen to learn the base gede (master spice paste) that defines Balinese cooking, followed by lunch at three different local spots — each the best in town for their specialty dish.', 'Morning market tastings, a spice paste lesson, and three local lunch stops.', ARRAY['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop'], '5 hours', 550000, 8, 'Food & Culinary', 'Ni Luh Putu Ayu', true, true, ARRAY['epicurean']),

('Craft Workshop Circuit', 'craft-workshop-circuit', 'Get your hands dirty in three different craft workshops in a single day: morning silver ring-making in Celuk, afternoon batik painting in Tohpati, and late-afternoon woodcarving in Mas. Each workshop is led by a master artisan from a multi-generational craft family. Take home three handmade pieces — a ring, a batik cloth, and a wooden figure — all made by you.', 'Make silver jewelry, paint batik, and carve wood in one day.', ARRAY['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'], '8 hours', 1200000, 4, 'Art & Craft', 'Komang Craftworks', true, true, ARRAY['creative']),

('Spiritual Healing Day', 'spiritual-healing-day', 'A deeply personal day of Balinese healing practices. Begin with a melukat (water purification) at a private spring temple, followed by a session with a traditional balian (healer), and end with a sound healing ceremony at a bamboo retreat. Your facilitator will help you integrate each experience and set intentions for your continued journey. Not for the spiritually curious — for the spiritually committed.', 'Water purification, traditional healer session, and sound healing in one day.', ARRAY['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop'], '8 hours', 1500000, 2, 'Wellness & Yoga', 'Eka Healing Journeys', true, true, ARRAY['seeker']),

('Instagram Photo Tour of Ubud', 'instagram-photo-tour-ubud', 'Hit every iconic Ubud photo spot in a single morning — the Gates of Heaven, the Tegallalang rice terrace swing, the Campuhan Ridge Walk, Ubud Palace, and a hidden jungle waterfall — all timed to avoid crowds and catch the best light. Your guide doubles as photographer and will shoot you at each location with professional angles. Includes edited digital photos delivered same day.', 'All the iconic shots in one morning, professionally photographed.', ARRAY['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&h=600&fit=crop'], '4 hours', 600000, 4, 'Photography', 'Bali Photo Tours', true, true, ARRAY['explorer', 'connector']);

-- ============================================
-- STORIES (8 stories, status: published)
-- ============================================

INSERT INTO stories (title, slug, subject_name, subject_tagline, photo_urls, narrative, theme_tags, status, published_at, is_placeholder, archetype_tags) VALUES
('The Balian Who Reads Your Soul', 'the-balian-who-reads-your-soul', 'Jero Mangku Suyasa', 'Seventh-generation balian healer in Ubud', ARRAY['https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?w=800&h=1000&fit=crop'], 'Jero Mangku Suyasa doesn''t call himself a healer. "The healing comes from Ida Sang Hyang Widhi," he says, referring to the Supreme God in Balinese Hinduism. "I am only a channel." But sitting in his family compound in Penestanan, surrounded by offerings and the smoke of incense, it''s hard not to feel that something extraordinary is happening.

For seven generations, his family has served as balians — traditional Balinese healers who use a combination of prayer, herbal medicine, and spiritual diagnosis to treat everything from physical illness to emotional distress. "Before Eat Pray Love, only Balinese came to see us," he laughs. "Now I see people from thirty countries. The sickness is different — they are not sick in the body, they are sick in the soul."

His consultations are simple: you sit, he prays, he reads your energy, and he tells you what he sees. There''s no crystal ball or dramatic ritual. Sometimes the prescription is herbal; sometimes it''s a ceremony at a specific temple. Often, it''s simply permission to feel what you''ve been avoiding. "Many people come to Bali to escape their lives," he observes. "But the island doesn''t let you escape. It makes you look."', ARRAY['Healer', 'Spiritual Guide'], 'published', NOW() - INTERVAL '10 days', true, ARRAY['seeker']),

('From Corporate Law to Sunrise Yoga', 'from-corporate-law-to-sunrise-yoga', 'Emma Richardson', 'Former London lawyer turned Ubud yoga teacher', ARRAY['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=1000&fit=crop'], 'Three years ago, Emma Richardson was billing 2,200 hours a year at a magic circle law firm in London. Today, she teaches sunrise yoga at The Yoga Barn and lives in a bamboo house in Penestanan with two rescue dogs and a growing collection of tropical plants.

"I didn''t come to Bali to find myself," she says, rolling her eyes at the cliché. "I came because I was burned out and my friend had a spare room. I thought I''d stay two weeks." Those two weeks turned into a month-long yoga teacher training, which turned into assisting classes, which turned into a completely new life.

The transition wasn''t as romantic as it sounds. "I cried a lot. I questioned everything. My parents thought I''d lost my mind. But every morning I''d get on the mat and something would shift." She now teaches four classes a week and runs a retreat twice a year. Her students range from backpackers to CEOs. "The mat doesn''t care about your job title," she says. "That''s the point."', ARRAY['Yogi', 'Expat Life'], 'published', NOW() - INTERVAL '8 days', true, ARRAY['seeker']),

('Silver, Fire, and Five Generations', 'silver-fire-and-five-generations', 'I Wayan Mudita', 'Fifth-generation silver artisan from Celuk village', ARRAY['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=1000&fit=crop'], 'The workshop is suffocatingly hot. A gas torch hisses as I Wayan Mudita melts a thumbnail-sized piece of silver, his hands steady as a surgeon''s despite 40 years of working with flame and metal. Around him, five other men — all relatives — tap, twist, and polish at individual workbenches in the cramped family studio.

"My great-great-grandfather made kris handles for the royal court," Mudita explains, holding up a ring decorated with such intricate filigree that it seems impossible to have been made by human hands. "Now I make jewelry for tourists. The skill is the same. Only the customer has changed."

Celuk village has been Bali''s silver capital since the 15th century, but the craft is under pressure. Mudita''s oldest son chose to study IT. His daughter, however, is learning the trade. "She has better hands than I did at her age," he says, allowing himself a rare smile. The family tradition, it seems, will survive — even if it takes a different path than expected.', ARRAY['Craftsperson', 'Local Legend'], 'published', NOW() - INTERVAL '6 days', true, ARRAY['creative']),

('Soil, Water, and the Subak Way', 'soil-water-and-the-subak-way', 'Pak Wayan Karsa', 'Rice farmer and subak water temple keeper in Tegallalang', ARRAY['https://images.unsplash.com/photo-1531592937781-2a5768714e8e?w=800&h=1000&fit=crop'], 'At 5am, while most of Ubud is still asleep, Pak Wayan Karsa is already ankle-deep in his rice paddy, checking the water level with a practiced eye. He''s been doing this since he was seven years old, learning from his father, who learned from his father, in an unbroken chain that stretches back a thousand years.

But Karsa isn''t just a farmer. He''s the pekaseh — the elected head — of his local subak, the ancient Balinese cooperative water management system that UNESCO recognized as a World Heritage cultural landscape in 2012. "The subak is not about rice," he explains. "It is about harmony. Between the farmer and the water. Between one farmer and his neighbor. Between humans and God."

The system works through a network of water temples, each managing the irrigation for a section of terraces. Decisions about planting schedules, water allocation, and pest management are made collectively at temple meetings. No one owns the water. "In the West, water is a resource," Karsa says. "Here, water is a gift. You use what you need and pass the rest to your neighbor."', ARRAY['Farmer', 'Environmentalist'], 'published', NOW() - INTERVAL '5 days', true, ARRAY['explorer']),

('Building Ubud''s Digital Village', 'building-ubuds-digital-village', 'Jessica Chen', 'Community builder and co-founder of Ubud''s largest coworking space', ARRAY['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop'], 'Jessica Chen didn''t plan to stay in Ubud. She was a product designer from San Francisco on a one-month workcation. That was in 2019. Now she runs one of Bali''s most vibrant coworking communities with 200 members from 35 countries.

"When I arrived, the digital nomad scene was scattered," she remembers. "People were working from cafes, but there was no community. No one was connecting the dots." She started with a weekly meetup at a local warung — five people showed up. Then ten. Then thirty. "I realized these people didn''t just need WiFi. They needed belonging."

Her coworking space is more than desks and fast internet. It hosts weekly skill-shares, monthly community dinners, annual retreats, and a mentorship program pairing nomads with local Balinese entrepreneurs. "The best thing about this community isn''t the networking," she says. "It''s that it breaks down the wall between expats and locals. We''re not just working here — we''re contributing."', ARRAY['Entrepreneur', 'Digital Nomad'], 'published', NOW() - INTERVAL '4 days', true, ARRAY['connector']),

('The Last Legong Dancer', 'the-last-legong-dancer', 'Ni Nyoman Candri', 'Master Legong dancer and teacher preserving classical Balinese dance', ARRAY['https://images.unsplash.com/photo-1558005137-d9619a5c539f?w=800&h=1000&fit=crop'], 'Ni Nyoman Candri''s fingers bend backward at impossible angles. Her eyes can move independently of her head. When she dances the Legong, it is as if she is not a human being at all but a character from a Balinese painting come to life.

At 68, Candri is one of the last dancers trained in the old style — before tourism simplified the performances, before YouTube shortened the training, before young girls chose K-pop over Legong. "I started at four years old," she says. "My teacher would bend my fingers and hold them in position for hours. If I cried, she would say: beauty requires suffering."

Now she teaches a new generation in a small studio behind her house in Peliatan. Her students range from five to fifteen years old, and their twice-weekly practices are grueling by any standard. But Candri sees something in them that gives her hope. "The dance is the prayer," she says, adjusting a student''s hand position with infinite patience. "As long as someone is dancing, the prayer continues."', ARRAY['Artist', 'Local Legend'], 'published', NOW() - INTERVAL '3 days', true, ARRAY['creative']),

('Cacao, Ceremony, and Consciousness', 'cacao-ceremony-and-consciousness', 'Indra Pratama', 'Balinese cacao ceremonialist bridging ancient and modern healing', ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop'], 'Indra Pratama grew up watching his grandmother roast cacao beans on an open fire in her village kitchen. "She would make a thick, bitter drink for ceremonies," he recalls. "It was sacred — not for everyday." Now he leads ceremonial cacao sessions for international visitors in a bamboo pavilion overlooking the Campuhan valley, and the drink his grandmother made has become part of a global wellness movement.

"The irony is not lost on me," he admits. "Balinese people have used cacao ceremonially for generations, and now Westerners are teaching us that it''s a ''superfood.''" But rather than resist the trend, Indra has found a way to bridge both worlds — honoring traditional Balinese ceremony while incorporating modern breathwork and sound healing.

His sessions begin with a traditional Balinese prayer and end with a contemporary sound bath. In between, participants drink ceremonial-grade cacao grown on his family''s small plantation and share intentions in a circle. "The cacao opens the heart," he says simply. "What you do with an open heart — that is your own journey."', ARRAY['Healer', 'Spiritual Guide'], 'published', NOW() - INTERVAL '2 days', true, ARRAY['seeker']),

('The Sound Student from Brooklyn', 'the-sound-student-from-brooklyn', 'Marcus Williams', 'American musician studying gamelan in Ubud', ARRAY['https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=1000&fit=crop'], 'Marcus Williams was a jazz drummer in Brooklyn with a decent career and a nagging feeling that something was missing. Then he heard a field recording of a Balinese gamelan orchestra and his life changed. "It was the most complex, beautiful, mathematical, spiritual music I had ever heard," he says. "I needed to understand it."

He arrived in Ubud three years ago with a one-way ticket and a letter of introduction to a master gamelan teacher in Peliatan. "I thought my jazz training would help," he laughs. "It didn''t. Gamelan is a completely different way of thinking about music. There''s no soloist. No ego. Every player interlocks with every other player like gears in a machine. If one person speeds up, the whole thing falls apart."

He now studies six days a week and plays in a community ensemble. "My jazz friends think I''m crazy. My gamelan teacher thinks I''m persistent, which in Bali is the highest compliment." He has no plans to return to New York. "I found the thing I was looking for," he says. "It just wasn''t where I expected."', ARRAY['Musician', 'Expat Life'], 'published', NOW() - INTERVAL '1 day', true, ARRAY['creative']);

-- ============================================
-- BLOG POSTS (8 posts, status: published)
-- ============================================

INSERT INTO blog_posts (title, slug, excerpt, content, status, published_at, is_placeholder, archetype_tags) VALUES
('The Subak System: How Bali''s Ancient Water Temples Still Feed an Island', 'subak-system-bali-ancient-water-temples', 'For a thousand years, Balinese farmers have managed water through a cooperative temple system that UNESCO calls a masterpiece of human genius. Here''s how it works — and why it matters.', 'For a thousand years, Balinese rice farmers have managed their water supply not through government bureaucracy or corporate ownership, but through a remarkable system of democratic cooperation centered on water temples. This system — called the subak — was recognized by UNESCO as a World Heritage Cultural Landscape in 2012, and it''s still functioning today, right here in the terraces around Ubud.

## How the Subak Works

At its simplest, the subak is a cooperative association of farmers who share water from a common source. Each subak manages a section of rice terraces and is governed by a water temple where members meet to make collective decisions about irrigation schedules, planting times, and pest management.

The genius of the system is its nested hierarchy. Village-level water temples coordinate with regional temples, which in turn answer to the supreme water temple at Pura Ulun Danu Batur on the rim of Mount Batur''s caldera. This creates a island-wide irrigation network managed not by engineers, but by priests and farmers working together.

## The Philosophy Behind It

The subak is built on the Balinese concept of Tri Hita Karana — the three causes of well-being: harmony with God, harmony with other people, and harmony with nature. Water isn''t treated as a commodity to be bought and sold. It''s a gift from the divine that must be shared equitably.

"In the West, water rights create conflict," explains Pak Wayan Karsa, a subak leader in Tegallalang. "In Bali, water creates community. You cannot farm alone — you must cooperate with your neighbors, or everyone''s crops fail."

## Why It Matters Today

In an era of water wars, climate change, and agricultural industrialization, the subak offers a radically different model. It proves that complex resource management can work without top-down control, that ancient systems can outperform modern ones, and that spiritual values and practical agriculture can coexist.

The next time you photograph those stunning Tegallalang rice terraces, remember: you''re not just looking at a landscape. You''re looking at a thousand-year-old democracy, still alive and still feeding people.', 'published', NOW() - INTERVAL '14 days', true, ARRAY['explorer', 'seeker']),

('Beyond Eat Pray Love: Ubud''s Healing Culture in 2026', 'beyond-eat-pray-love-ubud-healing-culture-2026', 'Elizabeth Gilbert put Ubud on the wellness map. But the real healing culture here goes far deeper than Instagram retreats — and it''s evolving in surprising ways.', 'It''s been nearly two decades since Elizabeth Gilbert made Ubud synonymous with spiritual seeking, and the town has changed enormously since then. The healing culture that attracted her — and millions of readers — is still very much alive, but it looks different than you might expect.

## The Traditional Layer

Balinese healing traditions date back over a thousand years and remain deeply woven into daily life. The balian (traditional healer) is still the first port of call for many Balinese families dealing with physical, emotional, or spiritual difficulties. Melukat (water purification ceremonies) happen daily at temples across Ubud. These aren''t tourist attractions — they''re living practices that most visitors never see.

## The Modern Layer

Layered on top of this ancient tradition is a thriving modern wellness industry. Ubud now hosts world-class yoga studios, meditation centers, breathwork facilitators, sound healers, and retreat spaces. The Yoga Barn alone offers 15+ classes daily. Pyramids of Chi pioneered sound healing architecture. And the annual BaliSpirit Festival draws thousands of wellness practitioners from around the world.

## The Tension

The relationship between traditional Balinese healing and the modern wellness industry is complex. Some traditional healers embrace the attention; others feel their sacred practices are being commercialized. Some modern practitioners deeply respect local traditions; others import Western wellness trends with little awareness of what already exists here.

## What''s Emerging

The most interesting developments in 2026 are happening in the space between these two worlds. A new generation of Balinese healers is finding ways to honor ancestral practices while making them accessible to a global audience. And the most thoughtful Western practitioners are learning from — rather than appropriating — local traditions.

The result is something neither fully traditional nor fully modern: a living, evolving healing culture that might just be Ubud''s most valuable export.', 'published', NOW() - INTERVAL '12 days', true, ARRAY['seeker']),

('A Guide to Ubud''s Weekly Dance Performances', 'guide-ubud-weekly-dance-performances', 'From the hypnotic Kecak fire dance to the ethereal Legong, here''s your night-by-night guide to catching Ubud''s best traditional performances.', 'Ubud is arguably the best place in the world to see traditional Balinese dance, with performances happening almost every night of the week at venues across town. Here''s your guide to what''s on, where, and what you''re actually watching.

## Monday: Legong Dance at Ubud Palace
The Legong is Bali''s most refined dance form, characterized by intricate finger movements, expressive eye work, and shimmering gold costumes. Performed in the candlelit courtyard of the Royal Palace, it tells the story of a king who dreams of a heavenly nymph. Arrive early for the best seats on the stone benches.

## Tuesday: Kecak Fire Dance at Padang Tegal
No instruments — just the synchronized chanting of 50-100 men seated in concentric circles. The Kecak tells the Ramayana story through voice alone, building to a climax where the monkey army''s chants merge into a wall of sound. The fire dance finale, where a performer kicks through burning coconut husks, is genuinely thrilling.

## Wednesday: Barong & Kris Dance at Batubulan
The eternal battle between good (Barong, a lion-like creature) and evil (Rangda, the demon queen). This dramatic dance includes a trance scene where performers turn krises (daggers) on themselves without injury — or so the tradition claims.

## Thursday: Legong & Barong at ARMA Museum
A combined program in the beautiful open-air stage at the Agung Rai Museum of Art. ARMA''s performances emphasize artistic quality over tourist spectacle, and the pre-show museum visit is included in the ticket.

## Friday: Kecak at Ubud Palace
Another chance to see the Kecak, this time in the atmospheric palace courtyard rather than an open field. The stone walls create a natural amphitheater that amplifies the chanting to goosebump-inducing effect.

## Saturday: Various at Multiple Venues
Saturday is Ubud''s busiest performance night, with options at the Palace, Padang Tegal, and several community stages. Check the notice boards outside the Palace and the tourist information office for the current schedule.

## Tips
- Tickets are typically 80,000-100,000 IDR, purchased at the door
- Performances start at 7:00 or 7:30 PM and last 60-90 minutes
- Arrive 30 minutes early for the best seats
- Photography is usually permitted (no flash)
- These are living art forms, not tourist shows — the dancers take their craft seriously', 'published', NOW() - INTERVAL '10 days', true, ARRAY['creative']),

('The Nomad''s Dilemma: Living in Ubud Without Losing It', 'nomads-dilemma-living-ubud', 'Every digital nomad in Ubud faces the same question: how do you enjoy paradise without turning it into the place you left? One long-term resident shares hard-won wisdom.', 'I''ve lived in Ubud for four years. In that time, I''ve watched the digital nomad population triple, seen three new coworking spaces open, and attended approximately 47 community meetups. I''ve also watched rice fields become villas, local warungs become smoothie bowls, and traffic go from "charming" to "genuinely problematic."

The nomad''s dilemma is this: we come to Ubud because it''s beautiful, authentic, and affordable. But our presence — in sufficient numbers — threatens all three of those qualities.

## The Uncomfortable Truth

Let''s be honest: when 50 people a day arrive from Canggu because "Ubud is the next thing," that''s not sustainable. When landlords realize they can charge foreigners five times the local rate, housing prices rise for everyone. When cafes discover that acai bowls outsell nasi campur, local food culture shifts.

This isn''t unique to Ubud — it''s the story of every desirable place that becomes a remote work hub. But knowing that doesn''t make the responsibility any less real.

## What We Can Do

After four years of thinking about this (and occasionally being part of the problem), here''s what I''ve learned:

**Spend locally.** Eat at warungs, not just Western cafes. Shop at the market, not the boutique. Your money has more impact when it goes directly to Balinese families.

**Learn the basics.** Even a few words of Bahasa Indonesia transforms your interactions. "Terima kasih" is a start, but "Om Swastiastu" (the Balinese Hindu greeting) goes further.

**Engage with the culture.** Attend a ceremony when invited. Learn about the subak system. Understand why offerings are placed on the ground before you step over them.

**Stay longer.** The worst impact comes from high-turnover, low-engagement visitors. The longer you stay, the more you contribute — and the more the place gives back.

Ubud doesn''t owe us anything. We chose to be here. The least we can do is be good guests.', 'published', NOW() - INTERVAL '8 days', true, ARRAY['connector']),

('Full Moon in Ubud: A Guide to Purnama Ceremonies', 'full-moon-ubud-purnama-ceremonies', 'Every full moon, Ubud transforms. Temples light up, offerings multiply, and the whole town takes on a sacred energy. Here''s how to experience Purnama as more than a spectator.', 'Every 30 days, Ubud changes. The full moon — Purnama — is one of the most important days in the Balinese Hindu calendar, and when it arrives, the whole town shifts into a higher gear.

## What Happens on Purnama

On the morning of Purnama, you''ll notice Ubud is different before you understand why. The offerings on the sidewalks are larger and more elaborate. Women in traditional dress carry towering fruit arrangements on their heads to the nearest temple. The air smells of incense and frangipani. Traffic slows (more than usual) as processions move through the streets.

Every temple in Ubud holds a ceremony on Purnama, and the larger temples — Pura Taman Saraswati, Pura Desa, Pura Gunung Lebah — host elaborate multi-hour rituals with gamelan music, dance, and communal prayer. Families dress in their finest white and gold, and the atmosphere is one of genuine devotion.

## How to Participate Respectfully

As a visitor, you''re welcome to observe most Purnama ceremonies — Balinese Hinduism is remarkably inclusive. Here''s how to do it right:

- **Dress appropriately.** Wear a sarong and sash (available at any market) covering your legs. Shoulders should be covered.
- **Follow the locals.** Sit where they sit, stand when they stand, and follow the prayer gestures (though no one expects you to know them perfectly).
- **Accept offerings.** If someone hands you a small flower or rice grains during a ceremony, accept them gratefully and follow what others do.
- **Don''t photograph during prayer.** Before and after is fine, but put your camera away during the actual prayer.
- **Ask permission.** If you''re entering a temple you haven''t visited before, ask at the entrance if visitors are welcome that day.

## The Melukat Option

The most immersive way to experience Purnama is to participate in a melukat (water purification ceremony) at Tirta Empul or one of the smaller holy springs around Ubud. Several local guides offer facilitated melukat experiences that include an explanation of the spiritual significance, proper attire, and guidance through the ritual. This is not a spa treatment — it''s a genuine spiritual practice, and many participants describe it as profoundly moving.

## Planning Around Purnama

Purnama follows the lunar calendar, so dates shift each month. Many yoga studios, healers, and retreat centers schedule special events around the full moon. If you''re planning a trip to Ubud and have flexibility on dates, timing your visit to include a Purnama will add an extraordinary dimension to your experience.', 'published', NOW() - INTERVAL '6 days', true, ARRAY['seeker']),

('From Paddy to Plate: Ubud''s Farm-to-Table Revolution', 'from-paddy-to-plate-ubud-farm-to-table', 'Ubud''s food scene is having a moment — and the best restaurants are looking no further than the rice paddies next door for inspiration.', 'Something remarkable is happening in Ubud''s food scene. After years of importing trends — avocado toast, smoothie bowls, plant-based everything — the most exciting restaurants are now looking inward, to the extraordinary culinary traditions that have sustained Bali for centuries.

## The New Guard

A handful of restaurants are leading what you might call Ubud''s farm-to-table revolution, though the term feels insufficient. This isn''t just about sourcing local ingredients — it''s about reconnecting modern cooking with ancient agricultural knowledge.

At the forefront are chefs who work directly with local farmers, foragers, and fishermen, building menus around what''s available rather than what''s trendy. The result is food that tastes unmistakably of this place: banana blossom salads, jackfruit curries, smoked duck from Balinese free-range breeds, and rice harvested from the terraces you can see from your table.

## Why Now?

Several forces are converging. Ubud''s international community has raised expectations for culinary sophistication. Meanwhile, a new generation of Balinese chefs — many trained abroad — are returning home with technical skills and a fresh appreciation for their own food culture.

There''s also a growing awareness among visitors that Balinese cuisine is vastly more complex and interesting than the "nasi goreng and satay" stereotype suggests. When diners are willing to pay for quality, farmers can afford to grow specialty crops and heritage varieties.

## What to Try

**Base Gede Workshop:** Learn to make the foundational spice paste that defines Balinese cooking — then understand why every family''s version is slightly different.

**Morning Market Tour:** Skip the tourist market and visit Ubud''s actual morning market (open from 4am) where local chefs source their ingredients.

**Warung Hopping:** The best food in Ubud isn''t in restaurants — it''s in family-run warungs serving recipes passed down through generations. Ask any local for their favorite and you''ll eat better than you will at most upscale places.

The farm-to-table movement in Ubud isn''t a trend. It''s a return to what Balinese food was always meant to be: deeply local, deeply seasonal, and deeply connected to the land.', 'published', NOW() - INTERVAL '4 days', true, ARRAY['epicurean']),

('Sacred Art, Living Tradition: Why Ubud''s Art Scene Is Different', 'sacred-art-living-tradition-ubud', 'In Ubud, art isn''t something that hangs in galleries — it''s woven into every aspect of daily life, from morning offerings to temple ceremonies.', 'Walk down any street in Ubud and you''ll step over art. The canang sari — those small palm-leaf trays filled with flowers, rice, and incense that blanket the sidewalks — are offerings to the gods, but they''re also exquisite miniature compositions of color, texture, and form. They''re made fresh every morning and swept away by evening. Art, in Bali, is not permanent. It''s not precious. It''s daily practice.

## Art as Spiritual Practice

This is what makes Ubud''s art scene fundamentally different from anywhere else in the world. In the West, we separate art from religion, craft from fine art, amateur from professional. In Bali, these distinctions don''t exist. The same man who carves temple doors also carves tourist souvenirs — and he considers both acts of devotion.

"Every village has an obligation to make beautiful things for the temple," explains Nyoman Artawan, a painter in Batuan. "This is not optional. It is dharma — duty. And because everyone must participate, everyone develops artistic skill."

## The Village Specializations

The villages around Ubud each specialize in a different art form, a tradition that dates back to royal patronage systems:
- **Batuan:** Detailed narrative painting in ink and natural pigments
- **Mas:** Woodcarving, from tiny figurines to life-sized statues
- **Celuk:** Silver and gold jewelry with intricate filigree work
- **Batubulan:** Stone carving, especially temple guardian statues

## The Contemporary Scene

Ubud''s art scene isn''t frozen in tradition. A vibrant contemporary art world has grown alongside the classical forms, with galleries like Neka Art Museum, ARMA, and Museum Puri Lukisan showcasing both traditional and modern Balinese art. Young Balinese artists are exploring new media while drawing on ancestral themes.

The result is one of the world''s most unique art ecosystems: a place where a thousand-year-old painting tradition coexists with cutting-edge contemporary art, where the line between sacred and secular is beautifully blurred, and where art is as essential as breathing.', 'published', NOW() - INTERVAL '2 days', true, ARRAY['creative']),

('The Sound of Ubud: Why Bali Is the World Capital of Sound Healing', 'sound-of-ubud-world-capital-sound-healing', 'From gamelan orchestras to crystal bowls, singing bowls to pyramid acoustics — Ubud has become the global epicenter of healing through sound. Here''s the story of how it happened.', 'Close your eyes anywhere in Ubud and you''ll hear it: the shimmer of a gamelan rehearsal drifting from a village temple, the deep vibration of a singing bowl from a yoga studio, the dawn chorus of birds amplified by the river valley''s natural acoustics. Ubud is, quite literally, a place that resonates.

It''s no accident that this small Balinese town has become the global capital of sound healing. The convergence of ancient Balinese musical traditions, modern wellness culture, and a landscape that seems designed for acoustic experiences has created something unprecedented.

## The Ancient Foundation

Balinese gamelan music is one of the world''s oldest and most sophisticated musical traditions. The bronze percussion orchestras — some with 25 or more players — produce a shimmering, interlocking sound that Western composers from Debussy to Steve Reich have tried (and failed) to replicate. It''s music designed not just for listening, but for altering consciousness.

"The gamelan is a technology for changing your brain state," says Marcus Williams, an American musician studying gamelan in Ubud. "The specific frequencies, the interlocking patterns — they put you in a trance. Balinese people have known this for centuries."

## The Modern Layer

Layered on top of this ancient tradition is a thriving modern sound healing scene. Pyramids of Chi pioneered architectural sound healing with its pyramid structures, specifically designed for acoustic resonance. Sound baths using Tibetan bowls, crystal bowls, gongs, and tuning forks happen nightly across Ubud.

The quality of practitioners here is remarkably high. "Sound healers come to Ubud because the environment supports their work," explains a local practitioner. "The acoustics of the valley, the spiritual energy of the temples, the openness of the visitors — everything amplifies the experience."

## Why It Resonates

Perhaps the deeper reason Ubud has become the sound healing capital is philosophical. Balinese culture doesn''t separate the sacred from the sonic. Every ceremony involves music. Every temple has a gamelan. Sound isn''t entertainment — it''s a bridge between the material and spiritual worlds.

When modern sound healers set up their bowls in Ubud, they''re joining a tradition that understands sound as something far more than vibration. They''re tapping into a place that has been using sound as medicine for a thousand years.', 'published', NOW() - INTERVAL '1 day', true, ARRAY['seeker', 'creative']);
