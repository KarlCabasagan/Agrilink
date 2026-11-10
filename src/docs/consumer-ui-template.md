# AgriLink Consumer UI Theme Template & Design System Guide
*Extracted directly from `src/pages/consumer/Home.jsx` and the modernized consumer core (`Product.jsx`, `Cart.jsx`, `Checkout.jsx`).*

---

## 1. Page Shell & Canvas Structure

Every consumer page must use this unified root wrapper to prevent layout shift, ensure consistent vertical rhythms, and eradicate horizontal scroll on mobile:

```jsx
<div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
    {/* Page-specific Mobile Top Header (< 768px) if not using default NavigationBar header */}
    <header className="md:hidden sticky top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
        {/* Left: Back button or Brand */}
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-700 hover:text-emerald-800 active:scale-95 transition-all"
                aria-label="Go back"
            >
                <Icon icon="mingcute:left-line" width="22" height="22" />
            </button>
            <h1 className="font-bold text-base text-slate-900 tracking-tight">Page Title</h1>
        </div>
        {/* Right: Actions or Spacer */}
        <div className="w-8" />
    </header>

    {/* Main Responsive Grid Container */}
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 md:mt-8 flex-1">
        {/* Breadcrumb / Desktop Title (>= 768px) */}
        <div className="hidden md:flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Page Title</h1>
                <p className="text-xs text-slate-600 mt-1 max-w-prose">
                    Contextual description supporting the primary purpose.
                </p>
            </div>
            {/* Optional Top Right Desktop Action */}
        </div>

        {/* Page Content */}
    </main>

    {/* Global NavigationBar (Desktop Top Header + Mobile Fixed Bottom Bar) */}
    <NavigationBar />
</div>
```

---

## 2. Color Palette & Surface Tokens

| Token Role | Tailwind Class | Hex / Equivalent | Purpose |
|---|---|---|---|
| **Canvas Background** | `bg-slate-50/50` | `#f8fafc / 50%` | Primary background across all consumer views |
| **Surface (Card / Sheet)** | `bg-white` | `#ffffff` | Elevated surface for cards, dialogs, forms |
| **Surface Translucent** | `bg-white/95 backdrop-blur-md` | `#ffffff / 95%` | Sticky navigation, floating checkout & bottom sheets |
| **Subtle Alt Surface** | `bg-slate-50` / `bg-slate-100/70` | `#f1f5f9` | Input backgrounds, summary breakdowns, pill hover |
| **Primary Brand Button** | `bg-emerald-700 hover:bg-emerald-800 text-white` | `#047857` → `#065f46` | Main call-to-actions, submit, confirm |
| **Brand Accent Highlight** | `text-emerald-800` | `#065f46` | Prices, key counts, hero titles |
| **Brand Light Badge** | `bg-emerald-100/70 text-emerald-800 border border-emerald-100/80` | `#d1fae5` | Category tags, verified indicators, status pills |
| **Warning / Notice** | `bg-amber-50 border border-amber-200/90 text-amber-900` | `#fffbeb` | Delivery shortage alerts, pending verification |
| **Danger / Destructive** | `text-slate-400 hover:text-red-600` | `#dc2626` | Delete, cancel order, remove favorite |
| **Primary Border** | `border-slate-200/90` | `#e2e8f0` | Standard card and modal borders |
| **Hairline Divider** | `border-slate-100` | `#f1f5f9` | Dividing lines inside cards, list rows |

---

## 3. Typography & Numerical Discipline

- **Headings**: `font-bold tracking-tight text-slate-900` (`text-xl` to `text-3xl`).
- **Body Measure (Emil Kowalski)**: Cap all paragraph text to `max-w-prose` (max 65ch width) so reading line length remains comfortable.
- **Tabular Numerals**: Apply `tabular-nums` (`font-variant-numeric: tabular-nums`) unconditionally to:
  - Prices: `₱50.00`
  - Quantities / Weights: `2.5 kg`
  - Order references: `ORD-12345`
  - Dates and timestamps
  - Counters and badges
- **Uppercase Tracking**: Whenever `uppercase` is applied, pair with `tracking-wider` or `tracking-caps` (e.g. `text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500`).
- **Punctuation Truncation**: Use the single ellipsis glyph `…` instead of three periods `...`.

---

## 4. Card & Container Architecture

### Standard Content Card
```jsx
<div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all duration-150">
    {/* Card Header */}
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Card Section Title</h2>
        <span className="text-xs text-slate-500 tabular-nums">Sub-meta</span>
    </div>
    {/* Card Body */}
</div>
```

### Product / Grid Item Card (from `Home.jsx`)
```jsx
<Link
    to={`/product/${product.id}`}
    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-700/40 hover:shadow-md transition-all duration-150 overflow-hidden flex flex-col active:scale-[0.98]"
>
    {/* Aspect 4:3 Image Container */}
    <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
        />
        {/* Top-Left Category Badge */}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100/80 shadow-xs">
            {product.category}
        </span>
        {/* Top-Right Favorite / Action Button */}
        <button
            type="button"
            className="absolute top-1 right-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-red-500 active:scale-95 transition-all"
        >
            <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                <Icon icon="mingcute:heart-line" width="17" height="17" />
            </div>
        </button>
    </div>

    {/* Content Details */}
    <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 leading-snug group-hover:text-emerald-800 transition-colors">
                {product.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                <Icon icon="mingcute:user-3-line" className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-medium text-slate-700 truncate">{product.farmerName}</span>
            </div>
        </div>

        {/* Price & Unit Row */}
        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between gap-1 mt-auto">
            <div className="tabular-nums">
                <span className="text-emerald-800 font-bold text-base">₱{Number(product.price).toFixed(2)}</span>
                <span className="text-[11px] font-normal text-slate-600 ml-0.5">/kg</span>
            </div>
        </div>
    </div>
</Link>
```

---

## 5. Form Controls & Interactive Buttons

### Primary Action Button
```jsx
<button
    type="button"
    className="min-h-[46px] sm:min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
>
    <Icon icon="mingcute:check-line" width="18" height="18" />
    <span>Save Changes</span>
</button>
```

### Secondary / Ghost Button
```jsx
<button
    type="button"
    className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-2xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
>
    <span>Cancel</span>
</button>
```

### Standard Input Field
```jsx
<div className="space-y-1.5">
    <label htmlFor="input-id" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Field Label
    </label>
    <input
        id="input-id"
        type="text"
        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white shadow-2xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all duration-150"
        placeholder="Enter value…"
    />
    {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
            <Icon icon="mingcute:alert-line" className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
        </p>
    )}
</div>
```

---

## 6. Micro-Interactions & Emil Kowalski Rules
- **Hit Area Target Minimum**: All clickable elements must achieve >= 44×44px hit bounds (`min-w-[44px] min-h-[44px]`).
- **Tactile Active Feedback**: Add `:active { transform: scale(0.98); }` to cards and buttons; `scale(0.95)` to standalone icon buttons.
- **Snappy Motion**: Keep modal entrances between 150ms–250ms with `cubic-bezier(0.16, 1, 0.3, 1)`. Animate strictly `transform` and `opacity`.
- **Zero Horizontal Overflow**: All wrapper structures must incorporate `w-full max-w-full overflow-x-hidden`.
- **Empty States**: Use standard `<StateView />` with clear icon, title, description, and primary CTA.
