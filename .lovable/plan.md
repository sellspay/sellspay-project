

# Home Page Restructure + Tabbed Feature Section + Darker Theme + Orange Buttons

## What Changes

### 1. Reorder Home Page Sections
Move the "Featured Assets" grid to appear AFTER "Why Creators Choose SellsPay" instead of before it.

New order:
```text
Hero
Sliding Banner
NEW: Tabbed Feature Bar (right under hero)
AI Tools Reveal (card panels)
AI Studio Promo
Value Props ("Why creators choose SellsPay")
Featured Assets (moved down here)
Featured Creators
```

### 2. New Tabbed Feature Section (Under Hero)
Inspired by the Kling-style bottom navigation bar from the reference image. A horizontal row of feature buttons where clicking each one changes the displayed content (title, description, and image/video preview).

Features to showcase:
- **Marketplace** -- Browse and sell digital assets
- **Image Generation** -- AI-powered product visuals
- **Video Generation** -- Text-to-video and image-to-video tools
- **Audio Tools** -- SFX, voice isolation, music splitting
- **AI Storefront** -- Build your creator page with AI

Each tab shows a title, description paragraph, feature tags, and a large preview image on the right side -- matching the "Product Features" layout from image 1.

### 3. Darker Background
Currently `--background: 0 0% 4%` (very dark gray). Will darken it to `0 0% 2.5%` and adjust `--card` from `0 0% 7%` to `0 0% 5%`, `--secondary` from `20 5% 12%` to `20 5% 9%`, and other surface tokens proportionally. This makes the entire site noticeably darker without going pure black.

### 4. Orange Outlined Buttons (Like Image 2)
The second reference shows rounded pill buttons with colored outlines and arrows. Instead of green, we use the existing orange/coral primary color. Create a new utility class or update button styling to support this look: rounded-full, border-primary, with arrow icons and transparent backgrounds.

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Reorder sections: move `MassiveProductGrid` below `ValueProps`. Add new `FeatureTabsBar` component. |
| `src/index.css` | Darken CSS custom properties: `--background`, `--card`, `--secondary`, `--muted`, `--accent`, `--border`, `--input` |
| `src/components/home/FeatureTabsBar.tsx` | **NEW FILE** -- Tabbed section with 5 feature categories, each with title, description, tags, and preview image. Horizontal scrollable button row on mobile. |

### New Component: FeatureTabsBar
- Horizontal row of 5-6 feature buttons (pill-shaped, orange outline, with icons and arrows)
- Active button gets filled orange background
- Content area below shows: left side = title + description + tag chips + "Learn More" link; right side = large preview image
- Smooth fade transition between tabs
- Responsive: buttons scroll horizontally on mobile, content stacks vertically

### CSS Variable Changes
```css
--background: 0 0% 2.5%;     /* was 4% */
--card: 0 0% 5%;              /* was 7% */
--secondary: 20 5% 9%;        /* was 12% */
--muted: 20 5% 10%;           /* was 14% */
--accent: 20 10% 9%;          /* was 12% */
--border: 20 5% 12%;          /* was 16% */
--input: 20 5% 12%;           /* was 16% */
--sidebar-background: 0 0% 3.5%; /* was 5% */
--sidebar-accent: 20 5% 9%;     /* was 12% */
--sidebar-border: 20 5% 10%;    /* was 14% */
```

### Button Style
Add a `.btn-feature-tab` class for the Kling-style buttons:
- `rounded-full` pill shape
- `border border-primary/60` orange outline
- Transparent background by default, `bg-primary text-white` when active
- Arrow icon on the right side
- Icon on the left for each feature

