---
PIPELINE: add-feature
CURRENT_PHASE: 5
STATUS: completed
---

# Feature Execution Plan: Universal Smooth Fade-In Image Animations

## Objective
Eliminate blank card flicker and abrupt image pop-in across consumer and producer product views by implementing universal smooth cross-fade transitions (`transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)`) and fading skeletons in `SafeImage`, and integrating `SafeImage` across remaining unmigrated product cards.

## Target Files Mapped (Blast-Radius Recon)
1. `src/components/SafeImage.jsx`: Core component providing skeleton pulse and cross-fade transition.
2. `src/pages/consumer/Cart.jsx`: Cart item produce images currently using unstyled `<img>`.
3. `src/pages/consumer/Orders.jsx`: Consumer order item produce cards currently using raw `<img>`.
4. `src/pages/producer/ProducerProduct.jsx`: Producer product hero image currently using raw `<img>`.
5. `tests/safe_image_audit.test.js`: Verification test suite asserting cross-fade transition and universal adoption.

## Minimal-Diff Implementation Steps

### Step 1: Smooth Cross-Fade Transitions in `SafeImage.jsx`
- Retain skeleton in DOM during fade-out with `transition-opacity duration-300 ease-out` (`opacity-100` -> `opacity-0`, `pointer-events-none`).
- Provide explicit inline style `transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)` to prevent caller utility classes (`transition-transform`) from clobbering the opacity transition property.
- Support `ease-out` decelerating curve compliant with Emil Kowalski motion rules.

### Step 2: Universal Card Adoption
- **`src/pages/consumer/Cart.jsx`**: Import `SafeImage` and replace line 508 raw `<img>` with `<SafeImage>` inside `w-20 h-20 rounded-2xl shrink-0 border border-slate-200`.
- **`src/pages/consumer/Orders.jsx`**: Import `SafeImage` and replace line 1703 raw `<img>` with `<SafeImage>` inside produce card thumbnails.
- **`src/pages/producer/ProducerProduct.jsx`**: Import `SafeImage` and replace line 1608 raw `<img>` with `<SafeImage>` inside hero image container (`h-64 sm:h-80 bg-slate-100`).

### Step 3: Test Verification in `tests/safe_image_audit.test.js`
- Assert `SafeImage.jsx` contains skeleton fade-out transition and inline opacity transition safety.
- Assert `Cart.jsx`, `Orders.jsx`, and `ProducerProduct.jsx` use `SafeImage` for product cards.
- Run `npm test` to verify 100% green suite.
