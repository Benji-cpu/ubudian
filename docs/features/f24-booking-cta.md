# F24: WhatsApp Booking CTA

**Phase:** 5 — Tours
**Depends on:** F23
**Blocks:** None

---

## What

"Book This Tour" button that opens WhatsApp with a pre-filled message. Simple, no payment processing for MVP.

## Components

- `src/components/tours/booking-cta.tsx` — Booking button/section

## Spec

### Booking Button
- Prominent CTA button: "Book This Tour" (brand primary color)
- On click: opens WhatsApp with pre-filled message
- WhatsApp URL format: `https://wa.me/[number]?text=[encoded message]`
- Pre-filled message: "Hi! I'd like to book The [Tour Name] tour. My preferred date is: [leave blank for them to fill]. Group size: [leave blank]. Thanks!"
- Fallback: email link with pre-filled subject if WhatsApp not available

### Booking Section
- Price prominently displayed: "$55 per person"
- Group info: "Small groups of up to 6 people"
- Duration: "4 hours"
- "Book via WhatsApp" primary button
- "Or email us" secondary link
- Brief note: "We'll confirm availability within 24 hours"

### Mobile Behavior
- WhatsApp link opens native WhatsApp app on mobile
- On desktop: opens WhatsApp Web

## Verification

- Button renders on tour detail page
- Click opens WhatsApp with correct number and pre-filled message
- Email fallback link works
- Works on mobile (opens WhatsApp app)
- Works on desktop (opens WhatsApp Web)
