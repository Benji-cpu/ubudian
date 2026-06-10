import type { VibeTag } from "@/lib/vibe-tags";

/**
 * SEO hub pages — evergreen landing pages for the practices people actually
 * search ("ecstatic dance ubud", "cacao ceremony ubud"). Top-level keyword
 * slugs, deliberately NOT under /events/[slug] (event slugs are auto-generated
 * from titles and would collide). Each hub renders live upcoming events +
 * the weekly recurring schedule for its vibe tags.
 */
export interface HubConfig {
  slug: string;
  /** H1 + og title */
  title: string;
  metaDescription: string;
  /** events match when vibe_tags overlaps */
  vibeTags: VibeTag[];
  /** editorial intro — brand register: lush, restrained, embodied */
  intro: string[];
}

export const HUBS: HubConfig[] = [
  {
    slug: "ecstatic-dance-ubud",
    title: "Ecstatic Dance in Ubud",
    metaDescription:
      "Every ecstatic dance and 5Rhythms gathering in Ubud, updated daily — weekly waves, ceremony dances, and the venues that hold them.",
    vibeTags: ["ecstatic-dance", "5rhythms"],
    intro: [
      "Barefoot, phone-free, no talking on the floor. Ubud's ecstatic dance culture runs deeper than anywhere else in Bali — from the Yoga Barn's long-running waves to Paradiso's Thursday Dance Temple and the smaller ceremonies that move between jungle shalas.",
      "This page tracks every ecstatic dance and 5Rhythms gathering on the valley's calendar — the standing weekly slots and the one-off ceremony dances — updated daily as new events land.",
    ],
  },
  {
    slug: "cacao-ceremony-ubud",
    title: "Cacao Ceremonies in Ubud",
    metaDescription:
      "Upcoming cacao ceremonies in Ubud — heart-opening circles, cacao + sound journeys, and full-moon gatherings, updated daily.",
    vibeTags: ["cacao-ceremony"],
    intro: [
      "Ceremonial cacao is Ubud's quiet constant — the cup that opens an evening of song, stillness, or dance. Some circles are intimate and unhurried; others build into kirtan or ecstatic movement as the night deepens.",
      "Below: every cacao ceremony currently on the valley's calendar, from weekly heart-opening circles to the full-moon gatherings that draw the whole field together.",
    ],
  },
  {
    slug: "contact-improv-ubud",
    title: "Contact Improvisation in Ubud",
    metaDescription:
      "Contact improv jams, labs, and classes in Ubud — weight-sharing, floorwork, and the weekly jams the community gathers around.",
    vibeTags: ["contact-improv"],
    intro: [
      "Weight, momentum, listening through skin. Ubud's contact improvisation scene gathers around its weekly jams and skills labs — spaces where the form is taught with care and danced with abandon.",
      "These are the CI jams, labs, and classes currently on the calendar. The informal jams that live in closed community channels surface here as soon as they're announced publicly.",
    ],
  },
  {
    slug: "tantra-ubud",
    title: "Tantra Workshops in Ubud",
    metaDescription:
      "Tantra workshops, temple nights, and embodied intimacy events in Ubud — facilitated, consent-forward, updated daily.",
    vibeTags: ["tantra", "kundalini-activation"],
    intro: [
      "Ubud holds one of the world's densest concentrations of tantra teaching — weekly jams, temple evenings, couples' intensives, kundalini activations. The range is wide; the thread is embodiment over theory, and consent as the ground everything stands on.",
      "Every tantra and conscious-intimacy event currently announced for the valley is below. We list facilitated, public events only.",
    ],
  },
  {
    slug: "sound-healing-ubud",
    title: "Sound Healing in Ubud",
    metaDescription:
      "Sound baths, gong journeys, and sound healing ceremonies in Ubud — where to lie down and be played through, updated daily.",
    vibeTags: ["sound-bath", "energy-healing"],
    intro: [
      "Bowls, gongs, voice, and the long reverberation of a room full of people lying still. Sound healing in Ubud ranges from daily studio sessions to ceremonial journeys timed to the moon.",
      "This page gathers every sound bath and sound-healing ceremony currently on the calendar, across the valley's studios, temples, and open-air shalas.",
    ],
  },
  {
    slug: "breathwork-ubud",
    title: "Breathwork in Ubud",
    metaDescription:
      "Breathwork journeys and ceremonies in Ubud — conscious connected breath, holotropic-style sessions, and weekly classes, updated daily.",
    vibeTags: ["breathwork"],
    intro: [
      "Breath is the cheapest ticket to an altered state, and Ubud treats it as ceremony — conscious connected breathing, holotropic-style journeys, breath paired with cacao or sound, held by facilitators who know how to bring a room back down.",
      "Below: every breathwork journey and class currently announced in the valley.",
    ],
  },
];

export function getHub(slug: string): HubConfig | undefined {
  return HUBS.find((h) => h.slug === slug);
}

/** Hubs whose vibeTags intersect the given event tags (for cross-linking). */
export function hubsForVibeTags(tags: string[] | null | undefined): HubConfig[] {
  if (!tags || tags.length === 0) return [];
  return HUBS.filter((h) => h.vibeTags.some((t) => tags.includes(t)));
}
