

# AI Studio 3.0 — Signature Canvas Overhaul

Give each workspace section a unique visual identity, layout structure, and content depth so no two tabs feel the same.

---

## Overview

The current `StudioHomeView` renders the same layout for every section: stat bar, hero card, tool grid, recent creations. This plan replaces that with **section-specific canvas components**, each with a unique layout, preview type, and content layers.

---

## Architecture Change

Currently:
```text
StudioCanvas -> StudioHomeView (same layout for all sections)
```

New:
```text
StudioCanvas -> routes to one of:
  - CampaignCanvas    (home / promo studio)
  - ListingsCanvas    (upgrade listings)
  - SocialCanvas      (social factory)
  - MediaCanvas       (media lab)
```

Each canvas has 3 content layers:
1. **Tool Interface** (unique layout per section)
2. **Example Outputs** (animated previews, before/after, mocks)
3. **Contextual Intelligence** (scores, tips, suggestions)

---

## New Components

### 1. `CampaignCanvas.tsx` — Promo Studio (Home)

**Energy**: Viral, cinematic, high contrast

**Layout**:
- **Hero strip** (260px): Left headline "AI Studio / Launch. Create. Optimize." + right animated preview stack (vertical promo frame, carousel slide, thumbnail before/after cycling via framer-motion)
- **Featured Actions** (2x2 grid, 220px tall cards): Launch Promo, Create Carousel, Upgrade Image, Optimize Listing — each with a visual background gradient, not just an icon
- **Trending Hooks** shelf: Horizontal scroll of 6 mock hook cards (auto-rotating text like "Stop scrolling...", "You're losing money if...", "This hack changed everything...") showing the kind of output the promo generator creates
- **Recent Creations** gallery (reuse existing component)
- **Recommended Next Steps**: Dynamic suggestions based on counts (e.g., "Create your first promo" if generationCount === 0, "Upgrade a listing" if productCount > 0 but no optimized descriptions)

### 2. `ListingsCanvas.tsx` — Store Optimizer

**Energy**: Analytical, conversion-focused, strategic

**Layout**:
- **Score Header** (full width bar): Animated gauges showing Clarity, Trust, SEO, CTA Strength — starts with placeholder values, feels like a performance dashboard
- **Split Preview Area**: Left = "Current Listing" mock (grey, plain text), Right = "Optimized" mock (highlighted improvements, badges). Uses a subtle slide animation between states
- **Quick Actions Row**: Pill buttons — "Improve Headline", "Add FAQ", "Strengthen CTA", "Add Urgency", "Optimize for SEO"
- **Tools Grid** below: The actual listing tools (product-description, sales-page-sections, upsell-suggestions, generate-hero, rewrite-brand-voice, create-faq, seo-landing-page) rendered as compact cards
- No flagship promo card — completely different vibe

### 3. `SocialCanvas.tsx` — Social Factory

**Energy**: Structured storytelling, swipe-based

**Layout**:
- **Platform Strip**: Large segmented control (TikTok / Instagram / YouTube / Twitter) at top — selecting one subtly tints the canvas
- **Content Type Shelf**: Horizontal scroll of content format cards (Carousel, Caption Pack, 10 Posts, Short-Form Script, Hook Generator) — each card shows a mini animated preview of the output type (e.g., carousel shows stacked slides, caption shows text with hashtags)
- **Canvas Area**: When no tool selected, shows an animated mock of a social post being assembled — text appearing, hashtags flying in, engagement metrics counting up
- **Tools Grid** below for social_content tools

### 4. `MediaCanvas.tsx` — Media Lab

**Energy**: Clean waveform, audio-focused

**Layout**:
- **Waveform Hero**: Large animated waveform visualization spanning full width (CSS animation, no real audio needed — decorative sine wave pattern)
- **Tool Categories** in two rows:
  - Row 1 "AI-Powered": SFX Generator, Voice Isolator, SFX Isolator, Music Splitter (larger cards with gradient backgrounds)
  - Row 2 "Utilities": Audio Cutter, Joiner, Converter, Recorder, Video to Audio, Waveform Generator (compact, smaller cards)
- Each card shows the tool's unique visual identity (waveform icon, stem visualization, etc.) instead of generic icons
- Active tools (with legacyRoute) get a prominent "Launch" button; coming-soon tools are hidden entirely

---

## Modified Components

### `StudioCanvas.tsx`
- Replace single `StudioHomeView` render with a switch on `activeSection`:
  - `campaign` -> `CampaignCanvas`
  - `listings` -> `ListingsCanvas`
  - `social` -> `SocialCanvas`
  - `media` -> `MediaCanvas`
- Pass through all existing props (stats, handlers, tools)

### `StudioHomeView.tsx`
- No longer used directly by StudioCanvas — its content is absorbed into `CampaignCanvas`
- Keep file for reference but it won't be rendered

### `StudioContextPanel.tsx`
- Add section-aware content: when `activeSection` is "listings", show SEO score preview; when "social", show platform selector; when "media", show format/quality controls
- Pass `activeSection` from `StudioLayout`

### `StudioLayout.tsx`
- Pass `activeSection` to `StudioContextPanel`
- Right panel now also appears for section views (not just active tools), but with section-specific context instead of tool-specific context

### `StudioSidebar.tsx`
- No structural changes, just ensure active state highlights correctly when switching between the new canvases

---

## Visual Identity Per Section

| Section | Background Accent | Preview Type | Motion Style |
|---------|------------------|--------------|--------------|
| Campaign | Warm orange radial glow | Vertical phone frame, auto-cycling hooks | Fast, energetic fade-ins |
| Listings | Cool emerald/teal tint | Split before/after comparison | Smooth analytical transitions |
| Social | Blue/indigo platform tint | Stacked card carousel animation | Swipe-like horizontal motion |
| Media | Purple/violet waveform | Animated sine wave hero | Pulsing, rhythmic motion |

---

## Animated Empty States

Each canvas has an animated idle state instead of blank space:
- **Campaign**: Mock phone with rotating hook text + caption overlay
- **Listings**: Typewriter effect showing a product description being rewritten
- **Social**: Post card assembling itself (text, image, hashtags appearing sequentially)
- **Media**: Waveform pulsing gently with "Drop audio to begin" prompt

---

## Recommended Next Steps (Intelligence Layer)

Added to `CampaignCanvas` bottom:
- Dynamic cards based on user data:
  - `productCount === 0`: "Add your first product to unlock AI tools"
  - `generationCount === 0`: "Create your first promo — it takes 30 seconds"
  - `assetCount > 0 && generationCount < 5`: "You have assets! Try generating a carousel"
- Each recommendation card has a CTA button that routes to the appropriate tool

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/tools/studio/CampaignCanvas.tsx` | Home/Promo studio with hero, featured actions, trending hooks, recommendations |
| `src/components/tools/studio/ListingsCanvas.tsx` | Analytical optimizer with score header, split preview, quick actions |
| `src/components/tools/studio/SocialCanvas.tsx` | Platform-aware content factory with format shelf and animated post mock |
| `src/components/tools/studio/MediaCanvas.tsx` | Audio-focused lab with waveform hero and tiered tool grid |

## Files Modified

| File | Changes |
|------|---------|
| `src/components/tools/studio/StudioCanvas.tsx` | Switch on activeSection to render section-specific canvas |
| `src/components/tools/studio/StudioContextPanel.tsx` | Add activeSection prop, render section-aware controls |
| `src/components/tools/studio/StudioLayout.tsx` | Pass activeSection to context panel, show right panel for sections too |

## Files Retired (kept, no longer rendered)

| File | Reason |
|------|---------|
| `StudioHomeView.tsx` | Content absorbed into CampaignCanvas |
| `FlagshipPromo.tsx` | Integrated into CampaignCanvas hero |
| `StudioHero.tsx` | Replaced by CampaignCanvas hero strip |
| `OutcomeSection.tsx` / `OutcomeCard.tsx` | Replaced by section-specific cards |
| `MediaUtilityGrid.tsx` | Replaced by MediaCanvas tiered grid |
| `CreatorControlStrip.tsx` | Stats in CampaignCanvas stat bar |

---

## Technical Notes

- All new canvases use framer-motion with section-specific `stagger` and `fadeUp` variants
- Animated previews are pure CSS/framer-motion (no real data needed) — decorative elements that make empty states feel alive
- Score gauges in ListingsCanvas use simple animated progress bars (framer-motion `animate={{ width }}`)
- Platform tinting in SocialCanvas uses CSS custom properties for accent color shifts
- No database changes required
- No new edge functions required
- Tool launch flow (`onLaunchTool`, `ToolActiveView`) remains unchanged

