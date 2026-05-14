# Dark Mode Rubric — "What Good Looks Like"

A graded checklist for The Ubudian's light/dark mode. Inspired by Anthropic's [Managed Agents Outcomes](https://docs.claude.com/en/api/agent-sdk/outcomes) pattern — a rubric the work is scored against, not a vibes check.

A page must pass **every pillar** before shipping a dark-mode change.

---

## How the token contract works in this codebase

Before the rubric: a brief note on the trap that this repo is wired into.

The token system in `src/app/globals.css` does two things at once. **Semantic tokens** (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, etc.) flip cleanly between themes — they're built for exactly this. But **brand tokens** (`bg-brand-cream`, `text-brand-charcoal`, `text-brand-deep-green`, `text-brand-terracotta`) *invert* in dark mode. `--brand-charcoal` is `#2D2D2D` in light and `#FAF5EC` in dark. `--brand-deep-green` is `#2C4A3E` light, `#8BAF8A` dark. `--brand-cream` is `#FAF5EC` light, `#252525` dark.

That inversion is fine *only* when paired with a surface that also flips. `text-brand-deep-green` on `bg-card`: works in both modes. `text-brand-deep-green` on `bg-white`: works in light, becomes a 3:1 sage on white in dark.

**`--brand-gold` is the only brand token that does not invert.** `#C9A84C` in both modes. Treat it as the signature colour for dark — accents, prices, active states.

---

## Pillar 1 — Token discipline

Every surface and text colour uses either a semantic token, or a brand token paired with a surface that flips with it.

**Banned in `src/components/**` and `src/app/**`** (excluding `globals.css`, OG image generators in `src/app/**/opengraph-image.tsx`, and email templates in `src/lib/email-templates.ts`):

- `bg-white`, `bg-black`, `bg-gray-*`
- `text-white`, `text-black`, `text-gray-*`
- `text-brand-charcoal` and `text-brand-charcoal/N` for body text on a non-brand surface (because `brand-charcoal` inverts but `bg-white` doesn't)

**Required**:

- Card and overlay surfaces: `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary`, `bg-background`, or `bg-brand-cream` (cream inverts to charcoal — fine).
- Body text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`.
- Brand text: `text-brand-deep-green` allowed on `bg-card` / `bg-background` / `bg-brand-cream`. `text-brand-gold` allowed anywhere (does not invert).

**Grader check (CI):**

```bash
rg "bg-white|bg-black|text-white|text-black|bg-gray-|text-gray-" \
  src/components src/app \
  --glob '!**/opengraph-image.tsx'
```

Zero hits outside the allow-list = pass.

---

## Pillar 2 — Brand colour usage rules

| Token | Light value | Dark value | When to use |
|---|---|---|---|
| `text-brand-deep-green` | `#2C4A3E` | `#8BAF8A` | Headlines & primary accents, **only** on `bg-card`/`bg-background`/`bg-brand-cream` |
| `text-brand-gold` | `#C9A84C` | `#C9A84C` | Anywhere. The single non-inverting accent — use for prices, active toggles in dark, the brand mark |
| `text-brand-terracotta` | `#B85C3F` | `#D4917F` | Price callouts, "Happening now" pulse. Both shades read on cream and on charcoal |
| `text-brand-charcoal` | `#2D2D2D` | `#FAF5EC` | **Avoid for body text.** It looks like a charcoal token but it's actually a foreground-on-surface token. Use `text-foreground` instead |

When in doubt: if the surface is hardcoded `bg-white`, the only brand colour safe to put on top is `brand-gold`. Everything else needs the surface to be tokenized.

---

## Pillar 3 — Contrast (WCAG AA minimum, both modes)

- **Normal text** (< 18px or < 14px bold): ≥ 4.5:1 against background.
- **Large text** (≥ 18px or ≥ 14px bold): ≥ 3:1.
- **Non-text UI** (icons, focus rings, toggle on/off, borders carrying meaning): ≥ 3:1.

**Grader check:** `@axe-core/playwright` filter to `color-contrast` and `focus-order-semantics`, run in `e2e/audit/dark-mode.spec.ts` on the full page list (pillar 6). Zero violations.

---

## Pillar 4 — State legibility

For every interactive surface in both themes:

- **Active vs inactive** — visually unambiguous. If you squint at the screenshot you can still tell which option is selected. (The current dark events page fails: active toggle is light-green pill on a light-grey container.)
- **Hover** — visible without being garish. Prefer `hover:bg-accent` or `hover:bg-muted/N` over pure white. Never `hover:bg-white` on dark.
- **Focus ring** — uses `ring-ring` token (deep-green light, sage dark) and is ≥ 3:1 against both the element and the surface behind it.
- **Disabled** — receded but still readable. `opacity-50` is fine; pure transparent is not.

---

## Pillar 5 — Aesthetic register (editorial luxury, not Bootstrap dark)

Per project memory, the brand register is Aman / COMO / National Geographic going dark — not generic dark mode. Specifically:

- **Backgrounds are warm-dark, not neutral charcoal.** Dark `--background` and `--card` should carry a hint of green-shift so they feel of-a-piece with the deep-green light brand. (Current `#1A1A1A` is neutral; `#161A18` is warmer and still passes contrast for foreground text.)
- **Card elevation reads as a separate plane**, not just a colour. `bg-card` is one step lighter than `bg-background`, plus a warm tinted border, not the default white-alpha.
- **Photography breathes** — images inside dark cards need padding or a hairline so they don't edge-burn into the surrounding dark.
- **Gold is the signature.** In dark mode, `brand-gold` should feel more luminous, not less. Headlines, prices, and "active" indicators on tabs/toggles are the right place to use it.

This pillar is scored by screenshot review, not axe.

---

## Pillar 6 — Coverage

Every rubric page passes pillars 1–5 in both themes. Pages:

**Public**: `/`, `/events`, `/events/[seeded-slug]`, `/experiences`, `/experiences/[seeded-slug]`, `/guides`, `/guides/[seeded-slug]`, `/stories`, `/stories/[seeded-slug]`, `/blog`, `/blog/[seeded-slug]`, `/about`, `/quiz`.

**Authed**: `/dashboard`, `/dashboard/saved`, `/admin`, `/admin/community`, `/admin/app-feedback`, `/admin/events`.

The grader spec at `e2e/audit/dark-mode.spec.ts` walks this list with both themes and produces a screenshot pair per route under `e2e/screenshots/{light,dark}/<route>.png`.

---

## When you change dark mode

1. Read this file.
2. Make the change.
3. Run `npm run test:audit` — the dark-mode grader must pass.
4. Eyeball the screenshot pair for the page(s) you touched.
5. Ship.

If you're tempted to write `bg-white` in a new component — don't. Use `bg-card`. If the design literally requires white in dark mode (rare), put it behind a `dark:bg-…` override and document why in the same diff.
