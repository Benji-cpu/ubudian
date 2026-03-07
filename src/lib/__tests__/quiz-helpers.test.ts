import { describe, it, expect } from "vitest";
import { getEventsForArchetype, getToursForArchetype, getStoriesForArchetype } from "../quiz-helpers";
import type { Event, Tour, Story } from "@/types";

// Minimal mock data
const mockEvents = [
  { id: "1", title: "Morning Yoga", category: "Yoga & Wellness", archetype_tags: ["seeker"] },
  { id: "2", title: "Art Show", category: "Art & Culture", archetype_tags: [] },
  { id: "3", title: "Community Dinner", category: "Community & Social", archetype_tags: ["connector"] },
  { id: "4", title: "Trail Run", category: "Sports & Adventure", archetype_tags: [] },
  { id: "5", title: "Jazz Night", category: "Music & Live Performance", archetype_tags: [] },
] as unknown as Event[];

const mockTours = [
  { id: "1", title: "Temple Tour", theme: "Spiritual & Healing", archetype_tags: ["seeker"] },
  { id: "2", title: "Rice Terrace Trek", theme: "Nature & Rice Terraces", archetype_tags: [] },
  { id: "3", title: "Cooking Class", theme: "Food & Culinary", archetype_tags: [] },
] as unknown as Tour[];

const mockStories = [
  { id: "1", subject_name: "Made", theme_tags: ["Healer", "Yogi"], archetype_tags: ["seeker"] },
  { id: "2", subject_name: "Sarah", theme_tags: ["Artist", "Writer"], archetype_tags: [] },
  { id: "3", subject_name: "Ketut", theme_tags: ["Farmer"], archetype_tags: [] },
] as unknown as Story[];

describe("getEventsForArchetype", () => {
  it("returns tagged events first", () => {
    const result = getEventsForArchetype(mockEvents, "seeker", 4);
    expect(result[0].id).toBe("1"); // tagged as seeker
  });

  it("fills with category matches", () => {
    const result = getEventsForArchetype(mockEvents, "seeker", 4);
    expect(result.length).toBe(4);
  });

  it("never exceeds limit", () => {
    const result = getEventsForArchetype(mockEvents, "seeker", 2);
    expect(result.length).toBe(2);
  });

  it("fills from remaining if not enough matches", () => {
    const result = getEventsForArchetype(mockEvents, "seeker", 5);
    expect(result.length).toBe(5);
  });
});

describe("getToursForArchetype", () => {
  it("returns tagged tours first", () => {
    const result = getToursForArchetype(mockTours, "seeker", 3);
    expect(result[0].id).toBe("1");
  });

  it("fills to limit", () => {
    const result = getToursForArchetype(mockTours, "seeker", 3);
    expect(result.length).toBe(3);
  });
});

describe("getStoriesForArchetype", () => {
  it("returns tagged stories first", () => {
    const result = getStoriesForArchetype(mockStories, "seeker", 3);
    expect(result[0].id).toBe("1");
  });

  it("fills to limit", () => {
    const result = getStoriesForArchetype(mockStories, "seeker", 3);
    expect(result.length).toBe(3);
  });
});
