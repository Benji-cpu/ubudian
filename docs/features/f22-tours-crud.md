# F22: Tours Data Model & Admin

**Phase:** 5 — Tours
**Depends on:** F04
**Blocks:** F23, F26

---

## What

Admin interface for managing tour offerings.

## Pages

- `src/app/admin/tours/page.tsx` — Tours list
- `src/app/admin/tours/new/page.tsx` — Create tour
- `src/app/admin/tours/[id]/edit/page.tsx` — Edit tour

## Components

- `src/components/admin/tour-form.tsx` — Create/edit form

## Spec

### Tour Form Fields
- Title (e.g., "The Wellness Flow")
- Slug (auto-generated, editable)
- Short description (for cards, max 200 chars)
- Full description (rich text)
- Photos (multiple upload, drag-to-reorder)
- Itinerary (rich text: step-by-step tour flow)
- Duration (text: "4 hours", "Full day (8 hours)")
- Price per person (number in USD)
- Max group size (number)
- Theme (dropdown: wellness, creative, spiritual, foodie, immersion)
- What's included (rich text: meals, transport, entry fees, etc.)
- What to bring (rich text: comfortable shoes, sunscreen, etc.)
- Guide name
- Booking WhatsApp number
- Booking email
- Active toggle (show/hide from public site)

### Initial Tour Data
| Title | Duration | Price | Max | Theme |
|-------|----------|-------|-----|-------|
| The Wellness Flow | 4h | $55 | 6 | wellness |
| The Creative Ubud | 4h | $55 | 6 | creative |
| The Spiritual Journey | 7h | $75 | 6 | spiritual |
| The Foodie Circuit | 4h | $55 | 6 | foodie |
| Full Ubud Immersion | 8h | $95 | 4 | immersion |

## Verification

- Create tour in admin → appears in admin list
- Edit tour → changes saved
- Active/inactive toggle works
- Photo upload and ordering works
