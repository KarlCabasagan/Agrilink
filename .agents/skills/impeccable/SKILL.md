---
name: impeccable
description: Design vocabulary, visual polish, critique, hardening, and micro-interaction engineering for high-craft frontends.
---

# Impeccable

Visual critique, token polish, and micro-interaction hardening framework.

## 1. Audit (`impeccable:audit`)
- Inspect font size scale, spacing grid alignment, and border-radius consistency.
- Validate color contrast against WCAG AA standards (4.5:1 minimum).
- Confirm layout stability and zero horizontal overflow across responsive breakpoints.

## 2. Critique (`impeccable:critique`)
- Evaluate visual hierarchy: primary focal point, rhythm, whitespace tension.
- Identify generic AI anti-patterns: excessive cards, generic gradients, uncurated typography.
- Review typography measure: limit body text to 65 characters per line (`max-w-prose`).

## 3. Polish (`impeccable:polish`)
- Apply tabular numerals (`tabular-nums`) to numbers, metrics, counts, and prices.
- Set uppercase tracking (`tracking-wider` / `letter-spacing: 0.05em+`).
- Use single ellipsis character (`…`) instead of three consecutive periods.
- Add instant active compression to interactive buttons and cards (`:active { transform: scale(0.97); }`).

## 4. Harden (`impeccable:harden`)
- Ensure all click/touch targets meet 44x44px minimum target sizes.
- Verify focus rings are clearly visible on keyboard navigation.
- Audit transitions: keep micro-interactions under 200ms with snappy ease-out curves; animate only `transform` and `opacity`.

## 5. Distill (`impeccable:distill`)
- Remove superfluous wrapper divs, redundant utility classes, and unused style declarations.
- Simplify visual noise while preserving semantic clarity.
