

# Campaign Canvas Redesign — Marketing Pack Generator

Transform Campaign from a vague "Deploy" page into a clear **Marketing Pack Generator** that shows users exactly what they get.

---

## Current State

The Campaign canvas has a generic hero ("Launch. Create. Optimize."), a freeform text input, a "Deploy" button, generic featured action cards, and a trending hooks shelf. It doesn't communicate what the campaign actually generates.

## New Structure

### Section 1: Hero with Clear Value Proposition

**Replace** the current headline and input area with:

- Headline: `Launch a Campaign in 60 Seconds.`
- Subtext: `Generate a complete content pack for your product — ready to post.`
- Below that, a "This campaign will generate:" list showing 6 deliverables as minimal icon+text rows (Video, Carousel, Hooks, Captions, Listing Rewrite, Email Draft) using thin lucide icons
- No emoji anywhere

### Section 2: Product + Goal Selector (Primary Action)

Replace the freeform "Describe your campaign..." input with structured controls:

- **Product Selector**: Reuse the existing `SourceSelector` component (already used in PromoVideoBuilder and CampaignRunner) to select a product
- **Goal Selector**: 5 pill buttons in a flex-wrap row:
  - "Get more sales" / "Get more traffic" / "Build trust" / "Launch new product" / "Promote discount"
- **Optional text input**: "Extra direction (optional)" -- single line, subtle
- **Primary CTA**: `Generate Campaign Pack` button (orange gradient, rounded-[10px])
- **Secondary CTA**: `Plan First (Advanced)` button (ghost variant) -- opens the existing `PromoVideoBuilder` dialog as the "planner" flow

### Section 3: Campaign Templates Shelf

Replace the current "Trending" hooks shelf with a **Campaign Templates** horizontal scroll:

- 5 template cards: "Viral TikTok Launch", "Premium Brand Launch", "Discount Push", "Trust Builder", "New Release"
- Each card: name + short description + subtle "Use Template" hover state
- Selecting a template pre-fills the goal + extra direction fields
- Cards styled with `bg-white/[0.02]` default, `bg-white/[0.05]` on hover, no borders

### Section 4: Example Pack Preview Grid

Replace the featured actions 2x2 grid with a **pack preview** showing what gets generated:

- 2-row, 3-column grid of preview cards:
  - Row 1: "Promo Video" (9:16 phone mockup with animated bars), "Carousel" (stacked slides visual), "Viral Hooks" (scrolling text preview)
  - Row 2: "Captions Pack", "Listing Rewrite", "Email Draft"
- Each card: title + subtle animated placeholder content (reuse existing animation patterns)
- These are static previews -- not interactive, just showing what the output looks like

### Section 5: Recent Creations (keep)

Keep the existing `RecentCreations` component at the bottom, unchanged.

### Remove

- "Trending" hooks shelf (replaced by templates)
- Featured Actions 2x2 grid (replaced by pack preview)
- Stat strip at the top (move into sidebar or remove -- sidebar already shows credits)
- "Recommended" section at bottom (the pack preview makes the value obvious)
- The animated phone preview on the right side of the hero (replaced by the pack preview grid below)

---

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `CampaignCanvas.tsx` | Full rewrite of the canvas content. New sections: hero, product+goal selector, template shelf, pack preview grid. Import `SourceSelector` and `ProductContextCard` from existing tool components. Add state for `selectedGoal`, `selectedTemplate`, `extraDirection`, `sourceMode`, `selectedProduct`. Wire "Generate Campaign Pack" to open `CampaignRunner` with a dynamically built step list based on goal. Wire "Plan First" to `onLaunchPromo` (opens PromoVideoBuilder). |
| `StudioCanvas.tsx` | Pass `onLaunchPromo` and products data through to CampaignCanvas (already done). No changes needed. |
| `StudioLayout.tsx` | No changes needed -- `PromoVideoBuilder` dialog already wired. |

### New Constants in CampaignCanvas

```text
GOALS = [
  { id: "sales", label: "Get more sales" },
  { id: "traffic", label: "Get more traffic" },
  { id: "trust", label: "Build trust" },
  { id: "launch", label: "Launch new product" },
  { id: "discount", label: "Promote discount" },
]

CAMPAIGN_TEMPLATES = [
  { id: "viral-tiktok", name: "Viral TikTok Launch", desc: "Fast cuts, bold hooks, trending audio", goal: "sales", direction: "Bold, aggressive, viral energy" },
  { id: "premium-brand", name: "Premium Brand Launch", desc: "Cinematic, elegant, trust-building", goal: "launch", direction: "Premium, elegant, aspirational" },
  { id: "discount-push", name: "Discount Push", desc: "Urgency-driven, countdown, scarcity", goal: "discount", direction: "Urgent, limited-time, scarcity" },
  { id: "trust-builder", name: "Trust Builder", desc: "Testimonial-style, proof-focused", goal: "trust", direction: "Authentic, proof-heavy, relatable" },
  { id: "new-release", name: "New Release", desc: "Teaser-reveal format, anticipation", goal: "launch", direction: "Teaser, anticipation, reveal" },
]

PACK_ITEMS = [
  { label: "Promo Video", desc: "9:16 vertical video", icon: Video },
  { label: "Carousel Post", desc: "5-slide swipeable", icon: GalleryHorizontal },
  { label: "10 Viral Hooks", desc: "Scroll-stopping openers", icon: MessageSquare },
  { label: "Captions Pack", desc: "With optimized hashtags", icon: Hash },
  { label: "Listing Rewrite", desc: "SEO-optimized copy", icon: FileText },
  { label: "Email Draft", desc: "Ready-to-send blast", icon: Mail },
]
```

### Component Interface Changes

`CampaignCanvasProps` adds:
- No new props needed -- `onLaunchPromo` already opens the PromoVideoBuilder (used for "Plan First")
- The "Generate Campaign Pack" button will open a `CampaignRunner` dialog inline (imported directly into CampaignCanvas) with dynamically assembled steps based on the selected goal

### Pack Preview Grid

Static preview cards using existing animation patterns:
- Promo Video card: reuse the animated phone mockup (already exists in current hero)
- Carousel card: 3 stacked rectangles with slight rotation
- Hooks card: 3 text lines fading in/out (reuse HOOKS array animation)
- Other cards: simple icon + placeholder bars

All cards use `bg-white/[0.02]` background, no borders, `rounded-xl`.

