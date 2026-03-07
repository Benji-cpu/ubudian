/**
 * Prompt templates for Gemini LLM event parsing, classification, and semantic dedup.
 */

import { EVENT_CATEGORIES } from "@/lib/constants";

const CATEGORIES_LIST = EVENT_CATEGORIES.join(", ");

export const CLASSIFY_MESSAGE_PROMPT = `You are an event classification assistant for The Ubudian, a community events platform for Ubud, Bali.

Analyze the following message and determine if it contains an event announcement or promotion.

An event is something that:
- Has a specific date/time (or recurring schedule)
- Happens at a specific location
- People can attend or participate in
- Examples: concerts, workshops, yoga classes, markets, festivals, retreats, meetups, ceremonies

NOT events:
- General discussions or questions
- Business promotions without a specific date
- Personal messages
- News articles (unless about a specific upcoming event)
- Job postings
- Accommodation listings

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "is_event": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`;

export const PARSE_EVENT_PROMPT = `You are an event data extraction assistant for The Ubudian, a community events calendar for Ubud, Bali.

Extract structured event data from the following message. The current year is ${new Date().getFullYear()}.

Available categories: ${CATEGORIES_LIST}

Rules:
- If no year is specified, assume the current year (${new Date().getFullYear()})
- Dates should be in YYYY-MM-DD format
- Times should be in HH:MM (24-hour) format
- If the message contains multiple events, extract each one separately
- For venue names, use the full name as written (normalization happens later)
- For price_info, include the currency and any "free" or "donation" info
- If a field is not mentioned, use null
- For category, pick the best match from the available categories
- For description, create a clean summary if the message is very informal/messy

Respond with ONLY valid JSON (no markdown, no code blocks). For a single event:
{
  "events": [
    {
      "title": "Event Title",
      "description": "Full description of the event",
      "short_description": "One-line summary (max 200 chars)",
      "category": "Category from the list",
      "venue_name": "Venue Name",
      "venue_address": "Address if mentioned",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD or null",
      "start_time": "HH:MM or null",
      "end_time": "HH:MM or null",
      "is_recurring": false,
      "recurrence_rule": "e.g. 'every Monday' or null",
      "price_info": "e.g. 'IDR 150,000' or 'Free' or null",
      "external_ticket_url": "URL or null",
      "organizer_name": "Organizer or null",
      "organizer_contact": "Contact info or null",
      "organizer_instagram": "@handle or null",
      "cover_image_url": "Image URL if available or null"
    }
  ]
}`;

export const PARSE_EVENT_IMAGE_PROMPT = `You are an event data extraction assistant for The Ubudian, a community events calendar for Ubud, Bali.

This image is an event flyer or poster. Extract all event details you can read from it. The current year is ${new Date().getFullYear()}.

Available categories: ${CATEGORIES_LIST}

Rules:
- If no year is specified, assume the current year (${new Date().getFullYear()})
- Dates should be in YYYY-MM-DD format
- Times should be in HH:MM (24-hour) format
- For category, pick the best match from the available categories
- If a field is not readable, use null

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "events": [
    {
      "title": "Event Title",
      "description": "Description from the flyer",
      "short_description": "One-line summary (max 200 chars)",
      "category": "Category from the list",
      "venue_name": "Venue Name",
      "venue_address": "Address if visible",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD or null",
      "start_time": "HH:MM or null",
      "end_time": "HH:MM or null",
      "is_recurring": false,
      "recurrence_rule": null,
      "price_info": "Price or null",
      "external_ticket_url": "URL or null",
      "organizer_name": "Organizer or null",
      "organizer_contact": "Contact or null",
      "organizer_instagram": "@handle or null",
      "cover_image_url": null
    }
  ]
}`;

export const SEMANTIC_DEDUP_PROMPT = `You are a duplicate event detection assistant for The Ubudian, an events platform for Ubud, Bali.

Compare the following two events and determine if they are the same event listed from different sources.

Consider:
- Same event title with slight variations (abbreviations, different languages, formatting)
- Same date and venue but different descriptions
- Same organizer hosting at the same time/place
- Recurring events vs. one-off events with similar names

Event A:
{EVENT_A}

Event B:
{EVENT_B}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "is_duplicate": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of why these are/aren't the same event"
}`;
