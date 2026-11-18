---
name: ui-ux-pro-max
description: Design token inheritance, responsive component scaffolding, accessible markup, and modern frontend layout patterns.
---

# UI UX Pro Max

Systematic UI scaffolding and design pattern matching for modern web applications.

## 1. Token & Pattern Discovery
- Inspect existing project tokens before generating markup: Tailwind configuration, CSS custom properties, spacing scales, and typography hierarchies.
- Never invent arbitrary colors, fonts, or novel card styles if established tokens exist in the repository.
- Reuse existing component patterns and shared UI primitives.

## 2. Component Scaffolding
- Build responsive, mobile-first layouts (375px mobile, 768px tablet, 1280px desktop).
- Group related controls with tight spacing (`gap-1.5` / `gap-2`), separating major sections distinctly (`gap-8` / `gap-12`).
- Include necessary states for every interactive component: default, hover, active, focus-visible, loading, empty, and disabled.

## 3. Accessibility & Usability (WCAG AA)
- Ensure interactive elements satisfy the 44x44px minimum click/tap target area.
- Enforce minimum 4.5:1 text-to-background contrast ratio for standard text.
- Use semantic HTML tags (`<main>`, `<nav>`, `<article>`, `<button>`) and ARIA labels where visual text is absent.
- Ensure full keyboard navigability with visible focus rings (`focus-visible:ring-2`).
