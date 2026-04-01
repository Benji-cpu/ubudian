import type { ArchetypeId, ArchetypeResult, QuizQuestion, QuizScores } from "@/types";

// ============================================
// ARCHETYPES
// ============================================

export const ARCHETYPES: Record<ArchetypeId, ArchetypeResult> = {
  seeker: {
    id: "seeker",
    name: "The Seeker",
    tagline: "You came here to deal with your stuff — and Ubud answered",
    description:
      "You didn't come to Ubud for the rice terraces. You came because something cracked open and you needed somewhere safe to fall apart and put yourself back together. Breathwork at sunrise. Shadow work retreats that leave you raw and clear. Full moon ceremonies at temples where the incense is still burning from the morning's offerings. Cacao ceremonies where you cry and laugh in the same breath. You're drawn to the practitioners who've done the work — the ones who hold space without flinching. Ubud has been catching seekers like you for decades, and the depth of what's available here will keep surprising you.",
    hero_image: "/images/archetypes/seeker.jpg",
    color: "brand-deep-green",
    content_keywords: {
      event_categories: ["Ceremony & Sound", "Yoga & Meditation", "Healing & Bodywork"],
      tour_themes: ["Spiritual & Healing", "Wellness & Yoga"],
      story_theme_tags: ["Healer", "Spiritual Guide", "Ceremonialist", "Breathwork Guide"],
    },
  },
  explorer: {
    id: "explorer",
    name: "The Explorer",
    tagline: "You say yes to the things that scare you a little",
    description:
      "You're the one who showed up to their first ecstatic dance not knowing what to expect and ended up barefoot and weeping with joy. First tantra workshop — terrified and exhilarated. First sound journey — didn't believe it would work, then felt something shift. You're in Ubud because you're done being comfortable. Every week there's a new edge to explore: an embodiment retreat, a breathwork session that takes you somewhere you've never been, a connection practice that breaks through every wall you've built. You're living the Ubud chapter of your life and you're going all in.",
    hero_image: "/images/archetypes/explorer.jpg",
    color: "brand-deep-green",
    content_keywords: {
      event_categories: ["Dance & Movement", "Tantra & Intimacy", "Retreat & Training"],
      tour_themes: ["Nature & Rice Terraces", "Adventure & Trekking"],
      story_theme_tags: ["Expat Life", "Dance Facilitator", "Facilitator"],
    },
  },
  creative: {
    id: "creative",
    name: "The Creative",
    tagline: "You don't just attend the ceremony — you make the music",
    description:
      "Ubud has been pulling artists, musicians, and makers here for over a century, and you're the latest in that lineage. Maybe you're the one playing medicine songs at the circle, building soundscapes for ceremonies, painting on the walls of the cafe, or writing the thing that's been burning in you since you arrived. The creative energy here is specific — it's not just pretty, it's sacred. The Kecak fire dance at the palace, the stone carvers in the villages, the sound healers crafting alchemical journeys — art in Ubud isn't decoration. It's practice.",
    hero_image: "/images/archetypes/creative.jpg",
    color: "brand-gold",
    content_keywords: {
      event_categories: ["Art & Culture", "Music & Performance", "Ceremony & Sound"],
      tour_themes: ["Cultural & Heritage", "Art & Craft"],
      story_theme_tags: ["Artist", "Musician", "Writer", "Craftsperson"],
    },
  },
  connector: {
    id: "connector",
    name: "The Connector",
    tagline: "You're the reason Ubud feels like a village",
    description:
      "You're at the women's circle on Monday, the sharing circle on Tuesday, the tantric temple on Wednesday, and the community dinner on Friday — and somehow you already know half the room at each one. You came to Ubud and immediately understood that the magic here isn't the place, it's the people. You're the one introducing the nervous newcomer to the facilitator they need to meet. The one organizing the potluck. The one who remembers everyone's name and asks about their sister. Connection isn't something you do — it's what you are.",
    hero_image: "/images/archetypes/connector.jpg",
    color: "brand-terracotta",
    content_keywords: {
      event_categories: ["Circle & Community", "Tantra & Intimacy"],
      tour_themes: ["Cultural & Heritage"],
      story_theme_tags: ["Entrepreneur", "Educator", "Facilitator", "Space Holder", "Local Legend"],
    },
  },
  epicurean: {
    id: "epicurean",
    name: "The Epicurean",
    tagline: "You feel everything and you wouldn't have it any other way",
    description:
      "You experience Ubud through your body. The bass vibration of a gong bath that enters your bones. Cacao ceremony where you feel the heartbeat of the entire room. A tantric touch practice where every nerve ending wakes up. The smoky satay at a roadside warung that makes you close your eyes. You're drawn to the sensory and the somatic — sound journeys, embodiment workshops, healing sessions that make you cry, and the kind of food that stops conversation. Ubud is a feast for people like you, and you're not leaving the table.",
    hero_image: "/images/archetypes/epicurean.jpg",
    color: "brand-terracotta",
    content_keywords: {
      event_categories: ["Ceremony & Sound", "Healing & Bodywork", "Tantra & Intimacy"],
      tour_themes: ["Food & Culinary"],
      story_theme_tags: ["Chef & Food", "Bodyworker", "Healer"],
    },
  },
};

export const ARCHETYPE_IDS: ArchetypeId[] = ["seeker", "explorer", "creative", "connector", "epicurean"];

// ============================================
// QUIZ QUESTIONS (6 questions, ~90 seconds)
// ============================================

function scores(primary: ArchetypeId, secondary?: ArchetypeId): Record<ArchetypeId, number> {
  return {
    seeker: primary === "seeker" ? 3 : secondary === "seeker" ? 1 : 0,
    explorer: primary === "explorer" ? 3 : secondary === "explorer" ? 1 : 0,
    creative: primary === "creative" ? 3 : secondary === "creative" ? 1 : 0,
    connector: primary === "connector" ? 3 : secondary === "connector" ? 1 : 0,
    epicurean: primary === "epicurean" ? 3 : secondary === "epicurean" ? 1 : 0,
  };
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "It's Saturday night in Ubud. Where are you?",
    type: "text",
    answers: [
      {
        id: "1a",
        text: "A cacao ceremony and sound journey under the stars",
        scores: scores("seeker", "epicurean"),
      },
      {
        id: "1b",
        text: "Ecstatic dance — barefoot, eyes closed, sweat dripping, no rules",
        scores: scores("explorer", "connector"),
      },
      {
        id: "1c",
        text: "A live music night where someone's playing medicine songs by firelight",
        scores: scores("creative", "seeker"),
      },
      {
        id: "1d",
        text: "A tantric temple exploring conscious touch with strangers",
        scores: scores("epicurean", "explorer"),
      },
    ],
  },
  {
    id: 2,
    question: "Someone hands you a flyer at the café. Which one makes you say 'I'm going'?",
    type: "text",
    answers: [
      {
        id: "2a",
        text: "3-day shadow work and breathwork retreat",
        scores: scores("seeker", "explorer"),
      },
      {
        id: "2b",
        text: "Embodied Tantra Level 1 Weekend Workshop",
        scores: scores("explorer", "epicurean"),
      },
      {
        id: "2c",
        text: "Medicine songs circle — a community devotional gathering",
        scores: scores("creative", "connector"),
      },
      {
        id: "2d",
        text: "Community dinner — twenty strangers, one long table, no phones",
        scores: scores("connector", "epicurean"),
      },
    ],
  },
  {
    id: 3,
    question: "Why did you really come to Ubud?",
    type: "text",
    answers: [
      {
        id: "3a",
        text: "Something broke open and I needed somewhere safe to put it back together",
        scores: scores("seeker", "connector"),
      },
      {
        id: "3b",
        text: "I wanted to feel alive in my body again",
        scores: scores("epicurean", "explorer"),
      },
      {
        id: "3c",
        text: "I followed the creative energy — this place has been pulling artists for a century",
        scores: scores("creative", "seeker"),
      },
      {
        id: "3d",
        text: "I kept meeting people who'd been here and they all had that glow",
        scores: scores("connector", "explorer"),
      },
    ],
  },
  {
    id: 4,
    question: "A friend back home asks what Ubud is really like. What do you tell them?",
    type: "text",
    answers: [
      {
        id: "4a",
        text: "It's where you go when you're ready to deal with your stuff",
        scores: scores("seeker", "connector"),
      },
      {
        id: "4b",
        text: "You'll try things that terrify you and thank yourself for every single one",
        scores: scores("explorer", "epicurean"),
      },
      {
        id: "4c",
        text: "It's the most creatively alive place I've ever been",
        scores: scores("creative", "connector"),
      },
      {
        id: "4d",
        text: "It's sensory overload in the best way — ceremonies, food, music, touch, all of it",
        scores: scores("epicurean", "creative"),
      },
    ],
  },
  {
    id: 5,
    question: "What's your perfect Ubud morning?",
    type: "text",
    answers: [
      {
        id: "5a",
        text: "Breathwork at sunrise, then sitting quietly with whatever came up",
        scores: scores("seeker", "creative"),
      },
      {
        id: "5b",
        text: "An embodiment practice I've never tried, then the best smoothie bowl on the island",
        scores: scores("explorer", "epicurean"),
      },
      {
        id: "5c",
        text: "Slow breakfast at a warung, journal open, listening to someone's transformation story",
        scores: scores("creative", "connector"),
      },
      {
        id: "5d",
        text: "A long conversation with someone I just met who's doing the exact same inner work",
        scores: scores("connector", "seeker"),
      },
    ],
  },
  {
    id: 6,
    question: "What keeps you coming back to Ubud?",
    type: "text",
    answers: [
      {
        id: "6a",
        text: "The ceremonies — full moons, temple nights, things that don't exist anywhere else",
        scores: scores("seeker", "epicurean"),
      },
      {
        id: "6b",
        text: "The edge — every week there's something I've never done before",
        scores: scores("explorer", "creative"),
      },
      {
        id: "6c",
        text: "The people — I've never felt this kind of community anywhere",
        scores: scores("connector", "seeker"),
      },
      {
        id: "6d",
        text: "Everything here is designed to make you feel something — and I'm addicted to feeling",
        scores: scores("epicurean", "connector"),
      },
    ],
  },
];

// ============================================
// SCORING
// ============================================

export function calculateArchetypeScores(
  answers: { question_id: number; answer_id: string }[]
): { primary: ArchetypeId; secondary: ArchetypeId; scores: QuizScores } {
  const totals: QuizScores = { seeker: 0, explorer: 0, creative: 0, connector: 0, epicurean: 0 };

  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.question_id);
    if (!question) continue;
    const chosen = question.answers.find((a) => a.id === answer.answer_id);
    if (!chosen) continue;

    for (const key of ARCHETYPE_IDS) {
      totals[key] += chosen.scores[key];
    }
  }

  const sorted = ARCHETYPE_IDS.slice().sort((a, b) => totals[b] - totals[a]);

  return {
    primary: sorted[0],
    secondary: sorted[1],
    scores: totals,
  };
}
