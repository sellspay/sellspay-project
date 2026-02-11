

# AI Studio 3.0 — Creator War Machine

Transform the current scrolling page into an immersive full-studio workspace layout with a sidebar, central creative canvas, and dynamic context panels.

---

## Architecture: Three-Panel Workspace

The `/tools` page gets a completely new layout structure:

```text
+------------------+-----------------------------------+---------------------+
|                  |                                   |                     |
|   LEFT SIDEBAR   |        CENTER CANVAS              |   RIGHT PANEL       |
|   (Navigation)   |        (Creative Area)            |   (Context Engine)  |
|                  |                                   |                     |
|   Promo Studio   |   Large preview / generation      |   Product selector  |
|   Store Optimizer|   area with visual proof           |   Style controls    |
|   Social Factory |                                   |   Platform picker   |
|   Media Lab      |   Recent creations feed           |   Credit estimator  |
|   Campaigns      |   when no tool active             |   Brand kit toggle  |
|   Assets         |                                   |                     |
|                  |                                   |                     |
+------------------+-----------------------------------+---------------------+
```

---

## What Changes

### 1. New Layout Shell (`StudioLayout.tsx`)
- Full-height (`h-screen`) three-panel layout using CSS grid
- Left sidebar: 64px collapsed / 240px expanded (icon-only mini mode with expand toggle)
- Center canvas: flexible, takes remaining space
- Right panel: 320px, appears contextually when a tool is active
- Dark glassmorphism aesthetic throughout

### 2. New Left Sidebar (`StudioSidebar.tsx`)
Replaces the old `ToolsSidebarNav.tsx` concept with a workspace-grade navigation:
- **Sections** (icon + label, collapsible to icon-only):
  - **Launch Campaign** (flame icon) -- opens Promo Studio (flagship)
  - **Upgrade Listings** (trending-up icon) -- Store Optimizer tools
  - **Social Factory** (share icon) -- Content generation tools
  - **Media Lab** (audio-lines icon) -- Audio/media utilities
  - **My Assets** (layers icon) -- Opens asset drawer
- Active item gets primary accent glow + left border indicator
- Bottom: Credit gauge (mini fuel bar showing remaining credits)
- Collapsed state: just icons, hover tooltip for labels

### 3. New Center Canvas (`StudioCanvas.tsx`)
The main stage. Two modes:

**A) Home Mode (no tool selected):**
- Top: Compact greeting bar with stat strip (Products | Assets | Generated | Credits)
- Main area: "Launch Campaign" hero card -- large, cinematic, single focus
  - Product thumbnail transformation animation
  - "Deploy" button (replaces "Generate")
  - Quick prompt input
- Below: Recent Creations horizontal gallery (live feed of generated assets)
- Below: Outcome quick-launch cards in a 2x2 grid (Grow Store / Social / Media / Campaigns) -- compact, not full sections

**B) Tool Active Mode:**
- Full canvas area dedicated to the tool
- ToolActiveView renders here (stripped of its own hero banner since the sidebar provides navigation context)
- Tool hero banner becomes a slim top bar (tool name + back button + credits)

### 4. New Right Context Panel (`StudioContextPanel.tsx`)
Only visible when a tool is active. Slides in from right.
- **Product Context**: Selected product card with thumbnail, name, price, tags
- **Creative Controls** (contextual per tool type):
  - Promo: Style cards (Hype/UGC/Educational/Premium/Direct Response/Minimal), Platform picker (TikTok/Reels/Shorts), Duration segmented control, Direction text box
  - Store tools: Before/after toggle, SEO score display
  - Media tools: Format selector, quality settings
- **Brand Kit Toggle**
- **Credit Estimator** with "Deploy" / "Launch" button at bottom
- Moderation banner appears inline here

### 5. Language/Copy Upgrades
Throughout the UI:
- "Generate" becomes **"Deploy"**
- "Create Promo Video" becomes **"Launch Campaign"**
- "Optimize My Store" becomes **"Upgrade Listings"**
- "Coming Soon" badges **removed entirely** (hide unready tools instead)
- Section emojis removed, replaced with subtle icon accents
- Post-generation: show heuristic scores (Engagement: High, Hook Score: 8.4, CTA Strength: Strong)

### 6. Post-Generation Intelligence Card (`GenerationScoreCard.tsx`)
After any generation completes, show a results card:
- **Projected Engagement**: High / Medium / Low (heuristic based on hook length, CTA presence)
- **Hook Score**: 1-10 (based on word count, power words, question format)
- **CTA Strength**: Strong / Medium / Weak
- Quick actions: Download, Copy Caption, Set as Promo, Create 5 Variations, Generate 10 Posts

### 7. Visual Style Upgrades
- Sidebar: `bg-[hsl(0_0%_3%)]` with `border-r border-white/[0.06]`
- Canvas: `bg-background` with subtle radial gradient glow behind active content
- Context panel: `bg-card/60 backdrop-blur-xl border-l border-white/[0.06]`
- Cards: 12px radius, `hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10`
- Active sidebar item: left-2 primary border + `bg-primary/8` background
- Primary buttons: `.btn-premium` pill-shaped with gradient
- Micro-animations: framer-motion for panel slide-in/out, card hover lift, canvas content fade transitions

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/tools/studio/StudioLayout.tsx` | Three-panel grid shell |
| `src/components/tools/studio/StudioSidebar.tsx` | Left navigation sidebar |
| `src/components/tools/studio/StudioCanvas.tsx` | Center creative canvas (home + active modes) |
| `src/components/tools/studio/StudioContextPanel.tsx` | Right context/controls panel |
| `src/components/tools/studio/GenerationScoreCard.tsx` | Post-gen heuristic scores |
| `src/components/tools/studio/StudioHomeView.tsx` | Home canvas content (hero card + recent + quick launch) |

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/Tools.tsx` | Rewrite to render `StudioLayout` instead of scrolling sections |
| `src/components/tools/ToolActiveView.tsx` | Strip hero banner, adapt for embedded canvas mode |
| `src/components/tools/studio/StudioHero.tsx` | Repurposed into compact canvas hero card |
| `src/components/tools/studio/FlagshipPromo.tsx` | Integrated into canvas home view |
| `src/components/tools/studio/RecentCreations.tsx` | Minor style tweaks for canvas context |

## Files No Longer Rendered (kept for reference)

| File | Reason |
|------|--------|
| `CreatorControlStrip.tsx` | Stats moved to sidebar bottom + canvas top bar |
| `OutcomeSection.tsx` / `OutcomeCard.tsx` | Replaced by compact quick-launch grid in canvas |
| `MediaUtilityGrid.tsx` | Tools accessed via sidebar "Media Lab" section |

---

## Technical Notes

- Three-panel layout uses `grid grid-cols-[auto_1fr_auto]` with framer-motion AnimatePresence for right panel
- Sidebar collapse state stored in localStorage for persistence
- No database changes required
- No new edge functions required
- All existing tool launch logic (`handleLaunch`, `ToolActiveView`, `PromoVideoBuilder`) stays intact -- just re-housed in the new layout
- Mobile: sidebar collapses to bottom tab bar, context panel becomes a bottom sheet

