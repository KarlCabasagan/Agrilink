---
PIPELINE: fix-bug
CURRENT_PHASE: 5
STATUS: completed
---

# Bug Fix Plan: Prevent Infinite Image Skeleton Pulsing & Ensure One-Time Fade-In

## Symptom & Root Cause
- **Symptom**: Images pulsing continuously across product and media cards.
- **Root Cause**: `SafeImage.jsx` skeleton div had `animate-pulse` (`animation: pulse 2s infinite`). Keyframe CSS animations take cascade precedence over `opacity-0` and transition styles. Even after `loaded === true`, the `animate-pulse` keyframe continuously animated opacity (1 <-> 0.5) over the image at `z-10`, creating an infinite visual strobe/pulsing effect.
- **Desired Behavior**: Skeleton displayed only once while image is loading; when image finishes loading, image fades in once (`opacity-0` -> `opacity-100` with 300ms cubic-bezier transition) and skeleton ceases pulsing / unmounts cleanly.

## Call Chain / Blast Radius
- `src/components/SafeImage.jsx`
- Tests: `tests/safe_image_audit.test.js`
- Reproduction test: `tests/safe_image_pulse_fix.test.js`

## Verification
- Reproduction test: `tests/safe_image_pulse_fix.test.js` PASSED.
- Universal SafeImage audit: `tests/safe_image_audit.test.js` PASSED.
- Full project test suite: 61/61 tests PASSED.
- Production build: `npm run build` PASSED (9.75s).
