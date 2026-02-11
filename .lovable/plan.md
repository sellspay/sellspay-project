

# AI Studio 2.0 — Complete UI Overhaul

This plan covers two changes: (A) moving the Usage Analytics widget to the Dashboard page, and (B) a full cinematic redesign of the AI Studio (/tools) page.

---

## Part A: Move Usage Analytics to Dashboard

Remove `UsageAnalyticsWidget` from `Tools.tsx` and add it as a new section at the bottom of `Dashboard.tsx`, after the Conversion Funnel card.

**Files changed:**
- `src/pages/Tools.tsx` — Remove the analytics import and section
- `src/pages/Dashboard.tsx` — Import and render `UsageAnalyticsWidget` after the conversion funnel

---

## Part B: AI Studio 2.0 — Cinematic Redesign

Replace the current tab-based grid layout with a revenue-focused, visually hierarchical page.

### New Page Structure (top to bottom):

**1. Hero Section (70-80vh, cinematic)**
- Dark gradient background with animated glow accents
- Left side: Large headline "AI Studio" with subtext "Create. Market. Sell. All in one place." + two CTA buttons ("Create Promo Video" as primary, "Optimize My Store" as secondary)
- Below buttons: live stat strip showing product count, asset count, credit balance (fetched from DB)
- Right side: Animated vertical phone-frame video preview mockup with auto-playing visual (CSS/framer-motion animation showing a thumbnail-to-promo transformation loop)

**2. Flagship Tool Block — Short-Form Promo Generator**
- Large cinematic card (not a small grid tile)
- Dark gradient background with subtle animated grid pattern
- Left: "Use Product" selector + quick prompt input + "Generate" button (opens PromoVideoBuilder)
- Right: Large vertical video preview placeholder with glowing border
- This is the primary revenue engine, visually dominant

**3. Creator Control Strip**
- Thin glassmorphism bar spanning full width
- Shows real-time stats: Products | Assets | Content Generated | Credits
- Fetched from DB (products count, tool_assets count, ai_usage_logs count, wallet balance)

**4. Outcome-Based Sections (replacing old tab grids)**

Section: "Grow My Store" (3 large cinematic cards)
- Product Optimizer (product-description tool)
- Sales Page Builder (sales-page-sections tool)
- Bundle and Upsell Creator (upsell-suggestions tool)
- Each card: dark gradient, visual preview area, title, 1-line benefit, hover glow + lift animation

Section: "Create Marketing Content" (4 cards showing output visuals)
- Carousel Generator
- Hook and Script Generator (short-form-script)
- Caption Pack (caption-hashtags)
- 10 Posts from Product (social-posts-pack)
- Each card shows a mock output visual (not just an icon)

Section: "Media Utilities" (smaller clean grid, 2 rows)
- SFX Generator, Voice Isolator, Music Splitter, Audio Cutter, etc.
- Compact cards, supportive weight — not hero-sized

**5. Recent Creations Section**
- Horizontal scrolling gallery of the user's most recent generated assets
- Fetched from `tool_assets` table (latest 12, images show thumbnails, audio/video show type icons)
- Makes the page feel alive and personalized

### Visual Style Rules
- Deep charcoal backgrounds with warm gradient highlights (orange/coral accent from existing theme)
- Glassmorphism panels with `bg-white/5 backdrop-blur-xl border border-white/10`
- Cards: 12px radius, soft outer glow on hover (`shadow-xl shadow-primary/10`), subtle lift (`hover:-translate-y-1`)
- Motion: framer-motion for section fade-in, card hover lift, hero parallax-like entrance
- Primary buttons: pill-shaped with gradient background (charcoal to orange), `::before` highlight
- No "Quick Tools" label, no "Coming Soon" spam on the main page, no equal-weight grids

### New Components Created
- `src/components/tools/studio/StudioHero.tsx` — Hero section with CTAs and stat strip
- `src/components/tools/studio/FlagshipPromo.tsx` — Large promo generator block
- `src/components/tools/studio/CreatorControlStrip.tsx` — Thin stats bar
- `src/components/tools/studio/OutcomeSection.tsx` — Reusable section wrapper (title + cards)
- `src/components/tools/studio/OutcomeCard.tsx` — Large cinematic tool card with visual preview area
- `src/components/tools/studio/MediaUtilityGrid.tsx` — Compact utility tools grid
- `src/components/tools/studio/RecentCreations.tsx` — Horizontal asset gallery

### Files Modified
- `src/pages/Tools.tsx` — Complete rewrite of the page layout (hero, flagship, sections, recent creations). Still handles `activeTool` state for launching tools via `ToolActiveView`.
- `src/pages/Dashboard.tsx` — Add UsageAnalyticsWidget import and render

### What Gets Removed
- Old 3-tab layout (Quick Tools / Campaigns / Store Assistant tabs)
- `QuickToolsGrid` and `StoreAssistantGrid` are no longer rendered on the main page (components kept for potential reuse)
- "Coming Soon" badges on the main page cards
- Equal-weight grid layout

### What Stays
- `ToolActiveView` — still used when a tool is launched
- `MyAssetsDrawer` — moved into the hero section header
- `CampaignsGrid` — campaigns are accessible via the "Create Marketing Content" section or the Flagship block
- `PromoVideoBuilder` — launched from the Flagship block
- `toolsRegistry` — still the source of truth for tool metadata

---

## Technical Notes

- All new components use framer-motion for entrance animations (staggered children)
- Stats in the hero and control strip are fetched via existing hooks (`useSubscription` for credits) and lightweight Supabase queries (product count, asset count)
- The Recent Creations section queries `tool_assets` with `limit(12)` ordered by `created_at desc`
- No database changes required
- No new edge functions required

