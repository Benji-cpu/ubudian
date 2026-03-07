# F32: Responsive Design Audit

**Phase:** 8 — Polish & Launch
**Depends on:** All pages
**Blocks:** F33

---

## What

Systematic check that all pages work well on mobile, tablet, and desktop.

## Breakpoints

- Mobile: 375px (iPhone SE / small Android)
- Mobile large: 428px (iPhone Pro Max)
- Tablet: 768px (iPad)
- Desktop: 1280px+

## Checklist

### Global
- [ ] Header nav collapses to hamburger on mobile
- [ ] Mobile menu works (open/close, all links)
- [ ] Footer stacks columns on mobile
- [ ] Newsletter signup form usable at all sizes
- [ ] No horizontal overflow on any page

### Landing Page
- [ ] Hero text readable on mobile
- [ ] Event cards stack on mobile
- [ ] Story cards stack on mobile
- [ ] Tour cards stack on mobile

### Events
- [ ] List view: single column on mobile
- [ ] Calendar view: usable on mobile (may need alternate layout)
- [ ] Week view: horizontal scroll or stacked days on mobile
- [ ] Filters: horizontal scroll tabs on mobile
- [ ] Event detail: all info accessible, map link tappable

### Stories
- [ ] Story grid: 1 column on mobile, 2-3 on desktop
- [ ] Individual story: photos responsive, narrative readable
- [ ] Theme filter: horizontal scroll on mobile

### Blog
- [ ] Post cards: 1 column on mobile
- [ ] Individual post: content readable, images responsive

### Tours
- [ ] Tour cards: stack on mobile
- [ ] Individual tour: photos responsive, booking CTA prominent
- [ ] WhatsApp button easily tappable on mobile

### Admin
- [ ] Sidebar collapses on mobile (hamburger or overlay)
- [ ] Forms usable on tablet+ (admin not expected on phone, but tablet should work)
- [ ] Tables scroll horizontally if needed

## Verification

- Test in Chrome DevTools at each breakpoint
- Test on actual mobile device (if available)
- No layout breaks, no unreadable text, no untappable buttons
