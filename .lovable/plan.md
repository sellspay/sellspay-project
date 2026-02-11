

# Artlist-Level Premium Refinement

Final pass to shift the studio from "AI SaaS" to "mature creative platform." Seven surgical changes, all visual.

---

## 1. Sidebar — 180px, Borderless, Typography-Only

**File**: `StudioSidebar.tsx`

- Shrink expanded width from 200px to 180px (collapsed stays 56px)
- Background: match page background `bg-[#0F1115]` instead of `hsl(0 0% 3%)` (too black, needs layering)
- Remove collapse chevron icons entirely — replace with a single thin horizontal line button (a `div` styled as a 16px wide, 2px tall bar)
- Header: remove the "Studio" text label (sidebar context is obvious from nav items)
- Nav items: increase font to `text-[15px]`, `font-medium`, `text-foreground/50` inactive, `text-foreground` active
- Active indicator: keep the 2px left bar but make it `bg-foreground/60` instead of `bg-primary` (less orange noise)
- Credit pill at bottom: just `text-[11px] text-muted-foreground/40 tabular-nums` with a tiny `h-1 w-1 rounded-full bg-foreground/20` dot — no background block at all

**File**: `StudioLayout.tsx`

- Update `sidebarWidth` from 200 to 180 (and collapsed stays 56)

---

## 2. Full-Bleed Hero — Remove All Containers

**File**: `CampaignCanvas.tsx`

- Remove the `<Rocket>` icon from the Deploy button — just text "Deploy"
- Remove icons from stat strip items (`Package`, `Layers`, `Zap`) — just number + label text
- Headline: bump to `text-5xl sm:text-6xl` with `tracking-tighter`
- Remove the second paragraph line ("Turn any product into...") — one short sentence max under the headline, or remove entirely and let the input field speak
- Deploy button: change from `bg-primary hover:bg-primary/90 rounded-full` to a clean gradient: `background: linear-gradient(180deg, #FF7A1A, #E85C00)`, `rounded-[10px]`, no outer glow, subtle `shadow-sm` only
- Featured Actions cards: remove the gradient overlay div (`bg-gradient-to-br opacity-40`) — just clean hover `bg-white/[0.02]`, icon at 20% opacity, no lift
- Remove icons from Featured Actions cards — just label + description, typography carries weight

---

## 3. Kill All Section Containers Across Canvases

**Files**: `ListingsCanvas.tsx`, `SocialCanvas.tsx`, `MediaCanvas.tsx`

ListingsCanvas:
- Before/After split: remove the `divide-x divide-white/[0.04]` — use spacing gap instead
- Remove `rounded-xl` wrapper on the split section — content sits directly in the flow
- Quick action pills: remove any remaining border classes, just text + hover background

SocialCanvas:
- Platform strip buttons: remove `bg-white/[0.04]` on active — use only `font-semibold text-foreground` vs `text-muted-foreground/50`
- Content type cards: remove `min-h-[130px]` (let content dictate height naturally)
- Post assembly mock: remove `bg-white/[0.02]` on the inner card — let it float on the background with just spacing
- Remove icons from content type cards — typography only

MediaCanvas:
- Waveform hero: keep the animated bars but remove the "Media Lab" text heading (sidebar says it)
- Remove "Drop audio to begin" prompt — the waveform animation is self-explanatory
- Remove the play button circle — too literal
- AI tool cards: remove `min-h-[130px]` — let content breathe naturally
- Remove icons from tool section headers ("AI-Powered", "Utilities")

---

## 4. Remove All Decorative Icons From Section Headers

**All canvas files**:
- "Trending" label: keep as `text-xs uppercase tracking-wider` — no icon
- "Performance" label: no icon
- "Social Tools" label: no icon
- "AI-Powered" / "Utilities" labels: no icon
- "Recent Creations" label: no icon
- "Listing Tools" label: no icon
- Tool cards themselves: remove the tool.icon render from tool grid cards — just name + description + credit cost. Icons add visual noise at this scale

---

## 5. Tone Down Button Glow System-Wide

**File**: `src/index.css`

Rewrite `.btn-premium` to be restrained:
- Background: `linear-gradient(180deg, #FF7A1A 0%, #E85C00 100%)`
- Border: `1px solid rgba(255, 122, 26, 0.2)`
- Box-shadow: `0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
- Remove `::before` glossy overlay entirely
- Remove `::after` inner glow border
- Hover: slight brightness increase (`filter: brightness(1.08)`), `translateY(-1px)`
- Active: `filter: brightness(0.95)`, `translateY(0)`
- Remove text-shadow
- No `!important` on color

---

## 6. Increase Content Density

**File**: `CampaignCanvas.tsx`
- Reduce main padding from `p-5 lg:p-6` to `p-4 lg:p-5`
- Reduce `space-y-6` to `space-y-5`
- Trending hooks cards: increase from `w-[260px]` to `w-[280px]`
- Featured Actions: reduce gap from `gap-3` to `gap-2`

**File**: `RecentCreations.tsx`
- Card size: keep `w-48 h-52`
- Remove the `Clock` icon from timestamp — just the text distance
- Remove "Recent Creations" label entirely — context is obvious from the content

**All canvases**:
- Standardize padding to `p-4 lg:p-5`
- Standardize section spacing to `space-y-5`

---

## 7. Remove Right Context Panel When No Tool Active

**File**: `StudioLayout.tsx`

Already done (only renders when `activeTool` is set). No changes needed here.

But update `StudioContextPanel.tsx`:
- Remove all the `!toolId && activeSection === "xxx"` blocks — they are never rendered now since the panel only shows when a tool is active
- This removes dead code and simplifies the component

---

## Files Modified

| File | Changes |
|------|---------|
| `StudioSidebar.tsx` | 180px, `bg-[#0F1115]`, remove chevrons/studio label, 15px nav text, minimal credit pill |
| `StudioLayout.tsx` | Update sidebarWidth to 180 |
| `CampaignCanvas.tsx` | Remove icons from stat strip/buttons/cards, bigger headline, clean Deploy button, tighter spacing |
| `ListingsCanvas.tsx` | Remove split divider, tighter spacing, no section icons |
| `SocialCanvas.tsx` | Clean platform strip, remove card icons, simplify post mock |
| `MediaCanvas.tsx` | Remove heading/play button, keep waveform, no card icons |
| `RecentCreations.tsx` | Remove Clock icon, remove section label |
| `StudioContextPanel.tsx` | Remove dead section-aware blocks |
| `src/index.css` | Rewrite btn-premium to subtle gradient, remove pseudo-elements |

## What Gets Removed
- All decorative icons from section headers and tool cards
- Chevron collapse icons
- "Studio" header label
- Rocket icon from Deploy button
- Glossy `::before` and inner glow `::after` on btn-premium
- Heavy box-shadow glow on buttons
- `divide-x` on listings split view
- "Media Lab" heading and play button in media canvas
- Clock icon from recent creations
- Dead section-aware code in context panel
- `bg-white/[0.04]` active states on platform strip

## What Stays
- Framer-motion stagger animations (subtle)
- Section-specific background glows (orange/emerald/indigo/violet)
- Animated phone preview in campaign
- Waveform bars in media
- Post assembly animation in social
- Before/after animation in listings
- Tool launch logic unchanged
