# Premium Scroll System

Reference implementation for Lenis + Framer Motion scroll animations on the Incuria landing page.

## Cursor skill (cross-project)

A reusable skill is saved at:

```
~/.cursor/skills/premium-scroll/
├── SKILL.md       # Agent quick-start + checklist
├── reference.md   # Full architecture blueprint
└── templates.md   # Copy-paste code templates
```

Invoke in any future project by mentioning smooth scroll, Lenis, parallax, or premium scroll animations — or ask the agent to use the **premium-scroll** skill.

## Implementation in this repo

| File | Purpose |
|------|---------|
| [`src/components/landing/SmoothScroll.tsx`](../src/components/landing/SmoothScroll.tsx) | Lenis provider synced with Framer Motion |
| [`src/components/landing/scrollMotion.ts`](../src/components/landing/scrollMotion.ts) | Variants (`blurReveal`, `cardReveal`) + hooks (`useParallaxY`) |
| [`src/components/landing/ScrollReveal.tsx`](../src/components/landing/ScrollReveal.tsx) | Generic blur-rise on viewport enter |
| [`src/components/landing/SectionHeader.tsx`](../src/components/landing/SectionHeader.tsx) | Staggered section titles with ornament |
| [`src/components/landing/Hero.tsx`](../src/components/landing/Hero.tsx) | Load reveal + scroll-linked parallax/exit |
| [`src/pages/LandingPage.tsx`](../src/pages/LandingPage.tsx) | `MotionConfig` + `SmoothScroll` wrapper |
| [`src/index.css`](../src/index.css) | Lenis global CSS |

## Architecture (3 layers)

1. **Scroll engine** — Lenis momentum scroll, one provider per landing route
2. **Scroll-linked** — `useScroll` + `useTransform` for hero parallax and section depth
3. **Viewport reveals** — `whileInView` + stagger variants for headers, cards, quotes

## Dependencies

```bash
npm install lenis framer-motion
```

## Scope

Smooth scroll is applied only to `LandingPage`. Authenticated app routes (mail, inbox, profile) use native scroll.

## Quick checklist for new sections

- [ ] Wrap marketing route in `SmoothScroll` + `MotionConfig reducedMotion="user"`
- [ ] Use `SectionHeader` for major section titles
- [ ] Use `cardReveal` + `custom={i}` for grids
- [ ] Use `useParallaxY` for split text/visual sections
- [ ] Gate all transforms with `useReducedMotion()`
- [ ] Do not animate footer heavily

## Tuning

Default Lenis values (in `SmoothScroll.tsx`):

| Option | Value |
|--------|-------|
| `lerp` | `0.085` |
| `duration` | `1.15` |
| `wheelMultiplier` | `0.85` |

See `~/.cursor/skills/premium-scroll/reference.md` for the full blueprint.
