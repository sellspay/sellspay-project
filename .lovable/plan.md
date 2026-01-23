
# Implementation Plan: Hire Editors, Home Page & Profile Enhancements

## Overview
This plan covers three main areas of improvement:
1. **Hire Editors Page** - Expandable editor cards with detailed view, username-first ordering, and social media icons
2. **Home Page Featured Section** - Carousel with arrows, like/comment stats, and "Hot" popularity badges
3. **Profile Page** - Add price labels to product cards

---

## 1. Hire Editors Page Enhancements

### 1.1 Create Editor Detail Dialog
**New Component: `src/components/hire/EditorDetailDialog.tsx`**

A modal dialog that opens when clicking an editor card, showing:
- Full profile picture (larger)
- Username prominently displayed, full name below
- Complete "About Me" section
- All services offered (not truncated)
- All languages spoken
- Location details
- Hourly rate
- Social media icons (Instagram, YouTube, Twitter/X, TikTok)
- "Hire Now" button

### 1.2 Update Editor Card Display
**Modify: `src/pages/HireEditors.tsx`**

- **Reorder name display**: Show `@username` first (prominent), then `full_name` below in smaller text
- **Add social media icons row** with clickable links:
  - Instagram icon (if linked)
  - YouTube icon (if linked)
  - Twitter/X icon (if linked)
  - TikTok icon (if linked)
- **Make card clickable** to open the detail dialog
- **Fetch `editor_social_links`** from the profiles table (JSONB field already exists)

### 1.3 Social Media Icons
Icons will be sourced from Lucide React:
- Instagram: Custom SVG or external icon
- YouTube: `Youtube` from lucide-react
- Twitter/X: Custom SVG (X logo)
- TikTok: Custom SVG

---

## 2. Home Page Featured Section

### 2.1 Convert to Horizontal Carousel
**Modify: `src/pages/Home.tsx`**

- Replace the grid layout with a horizontal scrollable carousel
- Display 7 products per visible row
- Add left/right arrow buttons for navigation
- Use the existing `HorizontalProductRow.tsx` pattern or Embla carousel

### 2.2 Add Like/Comment Stats
**Modify: `src/components/ProductCard.tsx` and `src/pages/Home.tsx`**

- Extend `ProductCard` to accept and display `likeCount` and `commentCount`
- Fetch like/comment counts when loading featured products
- Display stats below or on the product card (heart icon + count, message icon + count)

### 2.3 Add "Hot" Popularity Badge
**Modify: `src/components/ProductCard.tsx`**

- Add a new prop `showHotBadge?: boolean`
- Calculate "hot" status based on:
  - High like count (threshold TBD, e.g., top 20% of likes)
  - Recent creation date (within last 7 days with engagement)
- Display flame icon badge with "Hot" or "Trending" label

---

## 3. Profile Page Price Labels

### 3.1 Update Profile ProductCard
**Modify: `src/pages/Profile.tsx`**

The internal `ProductCard` component (lines 169-271) needs to display price:
- Add price badge overlay (top-left) showing:
  - "Free" for free products
  - Formatted price for paid products (e.g., "$9.99")
- Use the same formatting function as the main `ProductCard` component

---

## Technical Details

### Database Fields Used
- `profiles.editor_social_links` (JSONB) - Contains social links like `{instagram: "url", youtube: "url", twitter: "url", tiktok: "url"}`
- `product_likes` table - For counting likes
- `comments` table - For counting comments
- `products.featured` - Boolean for featured status

### New Interfaces

```typescript
// EditorProfile extended with social links
interface EditorProfile {
  // ...existing fields
  editor_social_links: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
    tiktok?: string;
    website?: string;
  } | null;
}

// Product extended with engagement stats
interface FeaturedProduct extends Product {
  likeCount: number;
  commentCount: number;
  isHot?: boolean;
}
```

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/hire/EditorDetailDialog.tsx` | Create | Full editor profile modal |
| `src/pages/HireEditors.tsx` | Modify | Add social icons, reorder names, add dialog trigger |
| `src/pages/Home.tsx` | Modify | Convert to carousel, fetch engagement stats |
| `src/components/ProductCard.tsx` | Modify | Add likeCount, commentCount, hotBadge props |
| `src/pages/Profile.tsx` | Modify | Add price badge to internal ProductCard |

### Social Media Icon Components
Will create small SVG components for platforms not in Lucide:
- Instagram (Lucide has this)
- YouTube (Lucide has this)
- Twitter/X (custom SVG needed)
- TikTok (custom SVG needed)

---

## UI Mockups

### Editor Card (Updated)
```text
┌─────────────────────────────────┐
│ [Gradient Bar]                  │
├─────────────────────────────────┤
│  [Avatar]  @username ✓          │
│            Daniel Visuals       │
│            📍 Los Angeles, USA  │
│                                 │
│  "Professional video editor..." │
│                                 │
│  [Video Editing] [Color] +2     │
│                                 │
│  🌐 English, Spanish            │
│                                 │
│  [IG] [YT] [X] [TikTok]        │
│                                 │
│  ⏱ $50/hr        [Hire Now]    │
└─────────────────────────────────┘
```

### Featured Carousel (Home Page)
```text
┌─────────────────────────────────────────────┐
│           ✨ Curated Selection              │
│           Featured Products                 │
│                                             │
│  [◀]  [Card][Card][Card][Card][Card]  [▶]  │
│        🔥Hot  $9.99          Free           │
│        ❤️12 💬3              ❤️5 💬1        │
└─────────────────────────────────────────────┘
```

---

## Implementation Order
1. Create EditorDetailDialog component
2. Update HireEditors page with social icons and dialog
3. Update ProductCard with engagement stats and hot badge
4. Update Home page with carousel and stats fetching
5. Update Profile page ProductCard with price labels
