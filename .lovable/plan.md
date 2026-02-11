

# Artlist-Level Refinement Pass

Strip the startup energy. Replace it with the calm, heavy confidence of a mature creative platform.

---

## 7 Changes

### 1. Slim Down Sidebar — Kill Borders and Weight

**File**: `StudioSidebar.tsx`

Current problems: 240px wide, heavy `border-r`, `border-b` separators, boxed credit gauge with `bg-primary/[0.06]`, "AI Studio" label in bold.

Changes:
- Shrink expanded width from 240px to 200px
- Remove `border-r border-white/[0.06]` -- use background color difference only
- Remove `border-b` on the header area
- Remove the `bg-primary/[0.06]` rounded box on the credit gauge -- replace with a subtle inline pill: just text `"142 credits"` with a tiny dot indicator, no background block
- Remove all icons from nav items -- typography only (the icons add visual noise). Active item gets a thin 2px left bar + slightly brighter text, nothing else
- Remove the collapse chevron icons -- sidebar auto-collapses are fine, but the toggle button should be a minimal line, not chevrons
- Overall background stays `bg-[hsl(0_0%_3%)]` but no hard edges

Also update `StudioLayout.tsx` grid columns from `240px` to `200px`.

### 2. Full-Bleed Hero — Remove Container Box

**File**: `CampaignCanvas.tsx`

Current: Hero is inside a `rounded-2xl border border-border/20 bg-card/30 backdrop-blur-xl` box.

Changes:
- Remove the rounded border container entirely -- hero content sits directly on the canvas background
- Remove the grid pattern overlay
- Remove the `bg-card/30` and `border` -- let the content breathe against the dark background
- Make the headline larger: `text-4xl sm:text-5xl` with tighter tracking
- Remove the "AI Studio" badge/icon above the headline -- the sidebar already says it
- Reduce the paragraph description to one short line, not two
- The Deploy button: remove `btn-premium` heavy glow -- use a clean `bg-primary hover:bg-primary/90` with subtle `shadow-sm`, rounded-full (pill), no `::before` highlight effect
- Move stat strip pills: remove borders from them, make them more minimal (just icon + number + label, no rounded-full border pill)

### 3. Kill Section Boxes Across All Canvases

**Files**: `CampaignCanvas.tsx`, `ListingsCanvas.tsx`, `SocialCanvas.tsx`, `MediaCanvas.tsx`

Everywhere there is `rounded-2xl border border-border/20 bg-card/30 backdrop-blur-xl` or `bg-card/20`:
- Remove borders entirely
- Remove `bg-card/xx` backgrounds -- let sections sit on the page background
- Use spacing and typography to create structure instead of containers
- Featured Actions cards: remove explicit `border` classes, keep only a very subtle `bg-white/[0.03]` on hover (not default)
- Trending Hooks cards: remove `border border-border/20` -- just text on background with spacing
- Listings Score Header: remove the rounded container -- scores sit directly in the flow
- Social platform strip: remove `border` from buttons -- use just text weight/color change for active
- Media waveform hero: remove `rounded-2xl border` container -- waveform bars sit directly on canvas

### 4. Remove All Decorative Icons from Section Headers

**Files**: All canvas files

Current: Every section title has an icon next to it (Flame, BarChart3, Sparkles, etc.)

Changes:
- Remove icons from section headers -- just use the text label
- "Featured Actions" -> just the cards, no heading needed (obvious from context)
- "Trending Hooks" -> "Trending" (shorter, cleaner)
- "Listing Performance" -> "Performance" 
- "AI-Powered" -> keep text, remove Sparkles icon
- "Content Formats" -> just the cards, minimal heading
- Remove the `<Flame>` icon from trending hook cards -- just the "Trending" label in small caps

### 5. Tone Down Button Glow System-Wide

**Files**: `CampaignCanvas.tsx`, other canvases

Changes:
- Deploy button: `bg-primary rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90` -- no heavy glow, no `shadow-xl shadow-primary/10`
- Card hover effects: change from `hover:shadow-xl hover:shadow-primary/10` to `hover:bg-white/[0.04]` only -- remove the shadow lift entirely, or keep only `hover:-translate-y-0.5` (subtle, not -1)
- Quick action pills in Listings: reduce border opacity, soften color

### 6. Increase Content Density — Tighten Spacing

**Files**: All canvas files

Changes:
- Reduce `space-y-8` to `space-y-6` across all canvases
- Reduce padding from `p-6 lg:p-8` to `p-5 lg:p-6`
- Featured Actions grid: reduce `min-h-[180px]` to `min-h-[140px]`
- Remove `max-w-[1200px] mx-auto` -- let content stretch wider to fill the canvas
- Recent Creations cards: increase from `w-40 h-48` to `w-48 h-52` (larger thumbnails)
- Trending hooks cards: increase from `w-[220px]` to `w-[260px]`
- Remove "Recommended Next" section title -- just show the cards inline if conditions match

### 7. Remove the Right Context Panel When No Tool is Active

**File**: `StudioLayout.tsx`

Current: Right panel is always visible (320px) even with no tool active, showing placeholder controls.

Changes:
- Only render `StudioContextPanel` when `activeTool` is set
- When no tool is active, the center canvas takes full width (no 320px reserved)
- This gives the canvas breathing room and removes the "empty sidebar" feel
- Update grid template: `activeTool ? "1fr 320px" : "1fr"`
- The section-specific context (listings scores, social platform picker, media format) moves into the canvas itself -- it's already there as part of each canvas component

---

## Files Modified

| File | Summary |
|------|---------|
| `StudioSidebar.tsx` | Slim to 200px, remove borders/separators, typography-only nav, minimal credit pill |
| `StudioLayout.tsx` | Update grid to 200px sidebar, conditional right panel |
| `CampaignCanvas.tsx` | Full-bleed hero, remove containers, clean button, tighter spacing |
| `ListingsCanvas.tsx` | Remove section containers, clean headers, softer cards |
| `SocialCanvas.tsx` | Remove containers, cleaner platform strip, tighter layout |
| `MediaCanvas.tsx` | Remove waveform container, cleaner tool cards |
| `RecentCreations.tsx` | Larger cards, remove border styling |
| `StudioContextPanel.tsx` | No changes needed (only renders when tool active) |

---

## What Gets Removed
- All `border border-border/20` on section containers
- All `bg-card/30 backdrop-blur-xl` on non-interactive elements  
- All decorative icons next to section headings
- Nav item icons in sidebar (typography carries weight)
- Heavy credit gauge box
- Right panel placeholder when no tool active
- `btn-premium` heavy glow on Deploy button
- `shadow-xl` hover effects on cards
- Grid pattern overlay in hero

## What Stays
- framer-motion stagger animations (subtle, not removed)
- Section-specific color accents (orange/emerald/indigo/violet glows)
- The animated phone preview in campaign hero
- Animated waveform bars in media
- Post assembly animation in social
- Before/after animation in listings
- All tool launch logic unchanged

