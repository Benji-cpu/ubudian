import type { ArchetypeId, ArchetypeResult, QuizQuestion, QuizScores, UserSegment } from "@/types";

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
// ROUTER QUESTION (segments users before quiz)
// ============================================

export interface RouterQuestion {
  question: string;
  options: { id: UserSegment; label: string; description: string }[];
}

export const ROUTER_QUESTION: RouterQuestion = {
  question: "What's your Ubud story?",
  options: [
    { id: "curious", label: "I've never been — but I'm curious", description: "You haven't visited Ubud yet" },
    { id: "visiting", label: "I'm visiting soon (or I'm here now)", description: "You're planning a trip or currently in Ubud" },
    { id: "local", label: "I live here", description: "Ubud is home" },
  ],
};

// ============================================
// QUIZ QUESTIONS (5 universal questions)
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
    question: "You have a free day with zero plans. What pulls you?",
    type: "text",
    answers: [
      { id: "1a", text: "A quiet place to sit with my thoughts and go inward", scores: scores("seeker", "creative") },
      { id: "1b", text: "Something physical I've never tried before", scores: scores("explorer", "epicurean") },
      { id: "1c", text: "Finding the local spot where interesting people gather", scores: scores("connector", "explorer") },
      { id: "1d", text: "A sensory experience — live music, incredible food, or a long walk somewhere beautiful", scores: scores("epicurean", "creative") },
    ],
  },
  {
    id: 2,
    question: "A friend invites you to something you've never done. What makes you say yes?",
    type: "text",
    answers: [
      { id: "2a", text: "It involves going deep — breathwork, ceremony, or something transformative", scores: scores("seeker", "explorer") },
      { id: "2b", text: "It's a little scary and I might be bad at it", scores: scores("explorer", "connector") },
      { id: "2c", text: "There's a creative element — music, art, or something I can make", scores: scores("creative", "seeker") },
      { id: "2d", text: "Good people will be there and conversations will be real", scores: scores("connector", "epicurean") },
    ],
  },
  {
    id: 3,
    question: "What kind of travel experience stays with you longest?",
    type: "text",
    answers: [
      { id: "3a", text: "The one that changed how I see myself", scores: scores("seeker", "connector") },
      { id: "3b", text: "The one where I pushed past my comfort zone", scores: scores("explorer", "epicurean") },
      { id: "3c", text: "The one where I discovered something beautiful I didn't know existed", scores: scores("creative", "connector") },
      { id: "3d", text: "The one I can still taste, hear, and feel in my body", scores: scores("epicurean", "seeker") },
    ],
  },
  {
    id: 4,
    question: "You're at a gathering where you don't know anyone. What do you do?",
    type: "text",
    answers: [
      { id: "4a", text: "Find the quietest corner and have one deep conversation", scores: scores("seeker", "creative") },
      { id: "4b", text: "Try whatever activity is happening — I'll figure it out", scores: scores("explorer", "epicurean") },
      { id: "4c", text: "Observe everything — the music, the space, the energy", scores: scores("creative", "epicurean") },
      { id: "4d", text: "Start introducing yourself and connecting people to each other", scores: scores("connector", "seeker") },
    ],
  },
  {
    id: 5,
    question: "What would make you feel most alive right now?",
    type: "text",
    answers: [
      { id: "5a", text: "A practice that strips away the noise and brings me back to what matters", scores: scores("seeker", "epicurean") },
      { id: "5b", text: "Saying yes to something that genuinely scares me", scores: scores("explorer", "creative") },
      { id: "5c", text: "Making something — writing, music, art, movement", scores: scores("creative", "connector") },
      { id: "5d", text: "Being in a room full of people where every conversation matters", scores: scores("connector", "explorer") },
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
