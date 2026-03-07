import type { ArchetypeId, Event, Tour, Story } from "@/types";
import { ARCHETYPES } from "./quiz-data";

/**
 * Two-tier content matching:
 * 1. Explicit archetype_tags on content
 * 2. Fallback to category/theme keyword matching
 */

export function getEventsForArchetype(events: Event[], archetype: ArchetypeId, limit = 4): Event[] {
  const config = ARCHETYPES[archetype].content_keywords;

  // Tier 1: explicit archetype_tags
  const tagged = events.filter((e) => e.archetype_tags?.includes(archetype));

  // Tier 2: category match
  const categoryMatch = events.filter(
    (e) => !tagged.includes(e) && config.event_categories.includes(e.category)
  );

  const combined = [...tagged, ...categoryMatch];

  // If still not enough, add other events as filler
  if (combined.length < limit) {
    const remaining = events.filter((e) => !combined.includes(e));
    combined.push(...remaining.slice(0, limit - combined.length));
  }

  return combined.slice(0, limit);
}

export function getToursForArchetype(tours: Tour[], archetype: ArchetypeId, limit = 3): Tour[] {
  const config = ARCHETYPES[archetype].content_keywords;

  const tagged = tours.filter((t) => t.archetype_tags?.includes(archetype));

  const themeMatch = tours.filter(
    (t) => !tagged.includes(t) && t.theme && config.tour_themes.includes(t.theme)
  );

  const combined = [...tagged, ...themeMatch];

  if (combined.length < limit) {
    const remaining = tours.filter((t) => !combined.includes(t));
    combined.push(...remaining.slice(0, limit - combined.length));
  }

  return combined.slice(0, limit);
}

export function getStoriesForArchetype(stories: Story[], archetype: ArchetypeId, limit = 3): Story[] {
  const config = ARCHETYPES[archetype].content_keywords;

  const tagged = stories.filter((s) => s.archetype_tags?.includes(archetype));

  const themeMatch = stories.filter(
    (s) =>
      !tagged.includes(s) &&
      s.theme_tags?.some((tag) => config.story_theme_tags.includes(tag))
  );

  const combined = [...tagged, ...themeMatch];

  if (combined.length < limit) {
    const remaining = stories.filter((s) => !combined.includes(s));
    combined.push(...remaining.slice(0, limit - combined.length));
  }

  return combined.slice(0, limit);
}
