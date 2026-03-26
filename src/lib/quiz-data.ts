import type { ArchetypeId, ArchetypeResult, QuizQuestion, QuizScores } from "@/types";

// ============================================
// ARCHETYPES
// ============================================

export const ARCHETYPES: Record<ArchetypeId, ArchetypeResult> = {
  seeker: {
    id: "seeker",
    name: "The Seeker",
    tagline: "Your soul craves stillness and transformation",
    description:
      "You came to Ubud not just to visit, but to be changed. Whether it's a sound bath under the stars, a cacao ceremony at dawn, or a silent meditation retreat in the jungle, you're drawn to experiences that quiet the noise and connect you to something deeper. Ubud has been calling seekers like you for centuries — and it has so much to show you.",
    hero_image: "/images/archetypes/seeker.jpg",
    color: "brand-deep-green",
    content_keywords: {
      event_categories: ["Ceremony & Sound", "Yoga & Meditation", "Healing & Bodywork"],
      tour_themes: ["Spiritual & Healing", "Wellness & Yoga"],
      story_theme_tags: ["Healer", "Yogi", "Spiritual Guide", "Ceremonialist"],
    },
  },
  explorer: {
    id: "explorer",
    name: "The Explorer",
    tagline: "You follow trails, not crowds",
    description:
      "While others sleep in, you're already halfway up a volcano to catch the sunrise. You'd rather trek through rice terraces than sit at a cafe, and you're happiest when you discover a hidden waterfall that isn't on any map. Whether it's a jungle dance or a dawn hike, you crave movement and discovery. Ubud is your kind of place — lush, wild, and full of paths that lead somewhere unexpected.",
    hero_image: "/images/archetypes/explorer.jpg",
    color: "brand-deep-green",
    content_keywords: {
      event_categories: ["Dance & Movement", "Art & Culture"],
      tour_themes: ["Nature & Rice Terraces", "Adventure & Trekking", "Photography"],
      story_theme_tags: ["Farmer", "Environmentalist", "Dance Facilitator"],
    },
  },
  creative: {
    id: "creative",
    name: "The Creative",
    tagline: "You see art in everything — and Ubud sees it in you",
    description:
      "Ubud has been a magnet for artists, musicians, and makers for over a century, and you fit right in. You're the one sketching at the art market, mesmerized by the Kecak fire dance, or learning to carve silver in a village workshop. Creativity here isn't just something you do — it's in the air, the architecture, the daily offerings. Let Ubud's living artistic tradition inspire your own.",
    hero_image: "/images/archetypes/creative.jpg",
    color: "brand-gold",
    content_keywords: {
      event_categories: ["Art & Culture", "Music & Performance", "Dance & Movement"],
      tour_themes: ["Cultural & Heritage", "Art & Craft"],
      story_theme_tags: ["Artist", "Musician", "Writer", "Craftsperson"],
    },
  },
  connector: {
    id: "connector",
    name: "The Connector",
    tagline: "You collect people, not things",
    description:
      "For you, the best part of travel is the people you meet. You're the first to join a sharing circle, show up at a community dinner, or dive into a connection practice with strangers who become friends by sunset. You've probably already made friends with half the community in town. Ubud's magic is its people — and you're already one of them.",
    hero_image: "/images/archetypes/connector.jpg",
    color: "brand-terracotta",
    content_keywords: {
      event_categories: ["Circle & Community", "Tantra & Intimacy"],
      tour_themes: ["Cultural & Heritage"],
      story_theme_tags: ["Entrepreneur", "Educator", "Expat Life", "Digital Nomad", "Local Legend", "Facilitator", "Space Holder"],
    },
  },
  epicurean: {
    id: "epicurean",
    name: "The Epicurean",
    tagline: "You savour every experience with all your senses",
    description:
      "You believe the best way to know a place is through full sensory immersion. Your Ubud itinerary is a feast: morning cacao ceremony, midday sound journey, afternoon at a healing session, evening farm-to-table dinner surrounded by rice paddies. From smoky satay at a roadside warung to the vibrations of a gong bath, you're drawn to experiences that you can taste, feel, and remember in your body.",
    hero_image: "/images/archetypes/epicurean.jpg",
    color: "brand-terracotta",
    content_keywords: {
      event_categories: ["Ceremony & Sound", "Healing & Bodywork"],
      tour_themes: ["Food & Culinary"],
      story_theme_tags: ["Chef & Food"],
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
    question: "It's your first morning in Ubud. What do you do?",
    type: "image",
    answers: [
      {
        id: "1a",
        text: "A breathwork session overlooking the rice terraces",
        image_url: "/images/quiz/yoga-rice-terraces.jpg",
        scores: scores("seeker", "explorer"),
      },
      {
        id: "1b",
        text: "Trek to a hidden waterfall before the crowds",
        image_url: "/images/quiz/hidden-waterfall.jpg",
        scores: scores("explorer", "creative"),
      },
      {
        id: "1c",
        text: "Wander the art market and sketch what inspires you",
        image_url: "/images/quiz/art-market.jpg",
        scores: scores("creative", "connector"),
      },
      {
        id: "1d",
        text: "Find the best local warung and chat with the owner",
        image_url: "/images/quiz/local-warung.jpg",
        scores: scores("epicurean", "connector"),
      },
    ],
  },
  {
    id: 2,
    question: "Which experience would you book first?",
    type: "image",
    answers: [
      {
        id: "2a",
        text: "A sacred water purification ceremony at Tirta Empul",
        image_url: "/images/quiz/tirta-empul.jpg",
        scores: scores("seeker", "creative"),
      },
      {
        id: "2b",
        text: "An ecstatic dance night at a jungle venue",
        image_url: "/images/quiz/volcano-trek.jpg",
        scores: scores("explorer", "seeker"),
      },
      {
        id: "2c",
        text: "A cacao ceremony and sound journey under the stars",
        image_url: "/images/quiz/cooking-class.jpg",
        scores: scores("epicurean", "creative"),
      },
      {
        id: "2d",
        text: "A village walking tour with a local guide",
        image_url: "/images/quiz/village-tour.jpg",
        scores: scores("connector", "explorer"),
      },
    ],
  },
  {
    id: 3,
    question: "You have one free evening. Where are you?",
    type: "image",
    answers: [
      {
        id: "3a",
        text: "A gong bath and sound journey under the stars",
        image_url: "/images/quiz/sound-healing.jpg",
        scores: scores("seeker", "creative"),
      },
      {
        id: "3b",
        text: "Watching the Kecak fire dance at Ubud Palace",
        image_url: "/images/quiz/kecak-dance.jpg",
        scores: scores("creative", "seeker"),
      },
      {
        id: "3c",
        text: "A farm-to-table dinner surrounded by rice paddies",
        image_url: "/images/quiz/farm-dinner.jpg",
        scores: scores("epicurean", "explorer"),
      },
      {
        id: "3d",
        text: "A community dinner where everyone's a stranger (at first)",
        image_url: "/images/quiz/community-dinner.jpg",
        scores: scores("connector", "epicurean"),
      },
    ],
  },
  {
    id: 4,
    question: "What motivates you most when you travel?",
    type: "text",
    answers: [
      {
        id: "4a",
        text: "Inner growth — I want to come home a different person",
        scores: scores("seeker", "connector"),
      },
      {
        id: "4b",
        text: "Adventure — I want stories I'll tell for years",
        scores: scores("explorer", "epicurean"),
      },
      {
        id: "4c",
        text: "Inspiration — I want to see the world differently",
        scores: scores("creative", "seeker"),
      },
      {
        id: "4d",
        text: "Connection — I want to meet people and understand how they live",
        scores: scores("connector", "creative"),
      },
    ],
  },
  {
    id: 5,
    question: "You're packing for Ubud. What goes in first?",
    type: "text",
    answers: [
      {
        id: "5a",
        text: "A journal and meditation cushion",
        scores: scores("seeker", "creative"),
      },
      {
        id: "5b",
        text: "Hiking boots and a waterproof camera",
        scores: scores("explorer", "creative"),
      },
      {
        id: "5c",
        text: "A sketchbook or instrument",
        scores: scores("creative", "connector"),
      },
      {
        id: "5d",
        text: "A list of food spots and market locations",
        scores: scores("epicurean", "explorer"),
      },
    ],
  },
  {
    id: 6,
    question: "What excites you most about Ubud?",
    type: "text",
    answers: [
      {
        id: "6a",
        text: "Centuries of spiritual tradition still alive today",
        scores: scores("seeker", "connector"),
      },
      {
        id: "6b",
        text: "Jungles, volcanoes, and rice terraces as far as the eye can see",
        scores: scores("explorer", "seeker"),
      },
      {
        id: "6c",
        text: "A creative scene that's been attracting artists for a hundred years",
        scores: scores("creative", "epicurean"),
      },
      {
        id: "6d",
        text: "The incredible food — from street stalls to fine dining",
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
