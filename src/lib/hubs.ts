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
  /** events match when vibe_tags overlaps (empty for a venue hub) */
  vibeTags: VibeTag[];
  /** venue hubs: events match when venue_name is in this list (exact match) */
  venueNames?: string[];
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
    title: "Sound Healing and Sound Baths in Ubud",
    metaDescription:
      "Sound bath and sound healing sessions in Ubud: gong journeys, bowls and ceremonies, where to lie down and be played through. Updated daily.",
    vibeTags: ["sound-bath", "energy-healing"],
    intro: [
      "Bowls, gongs, voice, and the long reverberation of a room full of people lying still. Sound healing in Ubud ranges from daily studio sessions to ceremonial journeys timed to the moon.",
      "This page gathers every sound bath and sound-healing ceremony currently on the calendar, across the valley's studios, temples, and open-air shalas.",
    ],
  },
  {
    slug: "kirtan-ubud",
    title: "Kirtan in Ubud",
    metaDescription:
      "Kirtan and mantra gatherings in Ubud: call-and-response singing, devotional music and chanting circles, updated daily.",
    vibeTags: ["kirtan-mantra"],
    intro: [
      "Kirtan is call-and-response singing: a leader offers a line, the room sings it back, and the repetition slowly does its work. In Ubud you will find it in studios, shalas and ceremony spaces, sometimes on its own and sometimes as the second half of a cacao evening.",
      "This page lists the kirtan and mantra gatherings currently on the calendar, the weekly circles and the one-off nights, updated daily as new events land.",
    ],
  },
  {
    slug: "meditation-ubud",
    title: "Meditation in Ubud",
    metaDescription:
      "Meditation and stillness sessions in Ubud: silent sits, guided practice and longer sessions, updated daily.",
    vibeTags: ["meditation-stillness"],
    intro: [
      "Ubud makes it easy to sit still. Between the morning classes, the guided evenings and the quieter silent sessions, there is usually somewhere to practise on any day of the week, whether you are new to it or have sat for years.",
      "Below: the meditation and stillness events currently on the calendar, updated daily.",
    ],
  },
  {
    slug: "live-music-ubud",
    title: "Live Music in Ubud",
    metaDescription:
      "Live music in Ubud: concerts, acoustic nights and gatherings with a band or a singer, updated daily from across the valley.",
    vibeTags: ["live-music"],
    intro: [
      "Ubud's live music runs from quiet acoustic evenings to full-band nights, often tucked inside a venue you might otherwise visit for something else. A good number of the community events here have a musician at the centre.",
      "This page lists the live music events currently on the calendar, updated daily as new ones land.",
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
  {
    slug: "yoga-barn-schedule",
    title: "The Yoga Barn schedule: events this week",
    metaDescription:
      "Events at The Yoga Barn in Ubud this week and beyond: workshops, dance, ceremonies and gatherings we collect daily. Independent listing.",
    vibeTags: [],
    venueNames: ["The Yoga Barn"],
    intro: [
      "The Yoga Barn is one of Ubud's best-known wellness venues, and a lot of the valley's community events are held there. The Ubudian is independent: we are not part of the venue. This page lists the events we collect for The Yoga Barn every day.",
      "It is not the venue's full class timetable. For the complete schedule of regular classes, check The Yoga Barn's own website.",
    ],
  },
  {
    slug: "paradiso-ubud-schedule",
    title: "Paradiso Ubud schedule: events this week",
    metaDescription:
      "Events at Paradiso Ubud this week and beyond: dance, gatherings and special nights we collect daily. Independent listing.",
    vibeTags: [],
    venueNames: ["Paradiso Ubud"],
    intro: [
      "Paradiso is a community space in Ubud that hosts a mix of events alongside its everyday programme. The Ubudian is independent: we are not part of the venue. This page lists the events we collect for Paradiso Ubud every day.",
      "It is not the venue's full timetable. For everything Paradiso has on, check Paradiso's own website.",
    ],
  },
  {
    slug: "pyramids-of-chi-schedule",
    title: "Pyramids of Chi schedule: events this week",
    metaDescription:
      "Events at Pyramids of Chi in Ubud this week and beyond: sound healing, meditation and gatherings we collect daily. Independent listing.",
    vibeTags: [],
    venueNames: ["Pyramids of Chi"],
    intro: [
      "Pyramids of Chi is a wellness centre on the edge of Ubud, known for its sound healing and meditation offerings. The Ubudian is independent: we are not part of the venue. This page lists the events we collect for Pyramids of Chi every day.",
      "It is not the venue's full class timetable. For the complete schedule, check the Pyramids of Chi website.",
    ],
  },
];

export function getHub(slug: string): HubConfig | undefined {
  return HUBS.find((h) => h.slug === slug);
}

/** Tag hubs whose vibeTags intersect the given event tags (for cross-linking). Venue hubs are never returned. */
export function hubsForVibeTags(tags: string[] | null | undefined): HubConfig[] {
  if (!tags || tags.length === 0) return [];
  return HUBS.filter((h) => h.vibeTags.some((t) => tags.includes(t)));
}

/** The venue hub whose venueNames include this venue, if any (exact match on venue_name). */
export function hubsForVenue(venueName: string | null | undefined): HubConfig[] {
  if (!venueName) return [];
  return HUBS.filter((h) => h.venueNames?.includes(venueName));
}

export function isVenueHub(hub: HubConfig): boolean {
  return (hub.venueNames?.length ?? 0) > 0;
}
