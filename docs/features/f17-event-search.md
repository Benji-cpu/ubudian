# F17: Event Search

**Phase:** 4 — Events Directory
**Depends on:** F12
**Blocks:** None

---

## What

Text search across events (title + description).

## Spec

- Search input at top of events directory (alongside or above filter tabs)
- Searches across: title, description, venue_name, organizer_name
- Debounced input (300ms delay)
- Results update in real-time (client-side) or via API query
- Clear button to reset search
- URL param: `/events?q=ecstatic+dance`
- Composable with category and date filters
- Empty state: "No events matching '[query]'. Try a different search."

## Implementation Options

**Option A: Client-side (simpler, fine for <500 events)**
- Load all upcoming events, filter in browser with JS string matching

**Option B: Supabase full-text search (better for scale)**
- Use PostgreSQL `tsvector` / `to_tsquery` for full-text search
- Create a search index on events table
- Query via Supabase RPC

Recommend starting with Option A, migrate to B if performance requires it.

## Verification

- Search input renders
- Typing filters events by title/description
- Clear button resets
- Works with category filters simultaneously
- Empty state shows for no results
