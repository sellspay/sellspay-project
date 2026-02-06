
# Creators Discovery Hub - Complete Rebuild

## Overview

Transform the basic Creators listing into a premium **Discovery Hub** that helps buyers find creators by niche (Day Traders, 3D Artists, Notion Architects, etc.). This includes:

1. **Hero Search Section** - Bold header with "Find your favorite Creator" and centered search bar
2. **Category Navigation Bar** - 12 industry-standard categories that are sticky and horizontally scrollable
3. **Redesigned Creator Cards** - Cover banners, self-labeled tags, niche labels, and stats footer
4. **Database Schema Update** - Add `creator_tags` column for self-labeling

---

## Database Changes

### Add `creator_tags` Column to Profiles

A new `text[]` column to store creator-selected categories:

```sql
ALTER TABLE profiles ADD COLUMN creator_tags text[] DEFAULT '{}';

-- Update the public_profiles view to include creator_tags
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  -- existing columns...
  p.creator_tags,
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'owner') as is_owner
FROM profiles p;
```

**Categories to support:**
- `software` - Software & SaaS
- `finance` - Trading & Finance
- `business` - E-commerce & Biz
- `design` - Design & Art
- `3d` - 3D & VFX
- `video` - Video & LUTs
- `education` - Courses & Tutorials
- `productivity` - Notion & Templates
- `audio` - Audio & Music
- `gaming` - Gaming & Mods
- `lifestyle` - Fitness & Lifestyle

---

## Component Architecture

### Category Configuration (Shared)

```typescript
const CREATOR_CATEGORIES = [
  { id: "all", label: "All Creators", icon: Zap },
  { id: "software", label: "Software & SaaS", icon: Code2 },
  { id: "finance", label: "Trading & Finance", icon: TrendingUp },
  { id: "business", label: "E-commerce & Biz", icon: Briefcase },
  { id: "design", label: "Design & Art", icon: PenTool },
  { id: "3d", label: "3D & VFX", icon: Box },
  { id: "video", label: "Video & LUTs", icon: Video },
  { id: "education", label: "Courses & Tutorials", icon: BookOpen },
  { id: "productivity", label: "Notion & Templates", icon: Layers },
  { id: "audio", label: "Audio & Music", icon: Music },
  { id: "gaming", label: "Gaming & Mods", icon: Gamepad2 },
  { id: "lifestyle", label: "Fitness & Lifestyle", icon: Smile },
];
```

---

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    ✦ Find your favorite Creator                     │
│                                                                     │
│      From Day Traders to 3D Artists—discover the pros powering      │
│                      the digital economy.                           │
│                                                                     │
│               ┌──────────────────────────────────────┐              │
│               │ 🔍 Search by name, niche, or handle  │              │
│               └──────────────────────────────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  [All] [Software] [Trading] [E-comm] [Design] [3D] [Video] [→ More] │  ← Sticky/Scrollable
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Showing 5 results for "All Creators"                               │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ [Cover Img] │  │ [Cover Img] │  │ [Cover Img] │  │ [Cover Img] │ │
│  │ ┌───────┐   │  │ ┌───────┐   │  │ ┌───────┐   │  │ ┌───────┐   │ │
│  │ │Avatar │ ✓ │  │ │Avatar │ ✓ │  │ │Avatar │   │  │ │Avatar │ ✓ │ │
│  │ └───────┘   │  │ └───────┘   │  │ └───────┘   │  │ └───────┘   │ │
│  │ Name [Owner]│  │ Name        │  │ Name        │  │ Name        │ │
│  │ Day Trading │  │ VFX Artist  │  │ Productivity│  │ Fitness     │ │
│  │ @handle     │  │ @handle     │  │ @handle     │  │ @handle     │ │
│  │             │  │             │  │             │  │             │ │
│  │ Bio text... │  │ Bio text... │  │ Bio text... │  │ Bio text... │ │
│  │             │  │             │  │             │  │             │ │
│  │ [finance]   │  │ [3d][video] │  │ [productivity│ │ [lifestyle] │ │
│  │ [software]  │  │ [design]    │  │ [design]    │  │ [education] │ │
│  │             │  │             │  │             │  │             │ │
│  │ 5p  12k  4.9│  │ 24p 1.2k 4.9│  │ 115p 8.5k 4.7│ │ 3p  900 5.0 │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CreatorCard Component Details

### Card Structure

```text
┌──────────────────────────────────────┐
│ ████████ COVER BANNER ████████████   │  ← h-24, gradient overlay
│ ██████████████████████████████████   │
├──────────────────────────────────────┤
│  ┌────┐                              │
│  │ AV │ ✓                [View Shop] │  ← Avatar + Verified + CTA
│  └────┘                              │
│                                      │
│  **Creator Name** [Owner Badge]      │  ← Name + optional owner badge
│  Day Trading                         │  ← Niche subtitle
│  @handle                             │  ← Username in gradient text
│                                      │
│  "Full-time Day Trader. Selling..."  │  ← Bio (2 lines max)
│                                      │
│  ┌─────────┐ ┌─────────┐             │
│  │ 📈 finance│ │ 💻 software│          │  ← Self-labeled tags
│  └─────────┘ └─────────┘             │
│                                      │
├──────────────────────────────────────┤
│  📦 5 Prods   |   🔥 12k Sales   |   ⭐ 4.9  │  ← Stats footer
└──────────────────────────────────────┘
```

### Visual Styling

- **Cover Banner**: Gradient overlay (from-black/60 to-transparent) for text readability
- **Avatar**: w-16 h-16 with ring-4 ring-zinc-900, positioned to overlap the banner
- **Verified Badge**: Blue checkmark, rainbow animated for owner role
- **Owner Badge**: Orange gradient pill "Admin" 
- **Tag Pills**: Zinc-800 with category icon and lowercase text
- **Stats Footer**: Zinc-800/50 background with Package/Flame/Star icons

---

## Data Fetching Strategy

### Enhanced Creator Interface

```typescript
interface Creator {
  id: string;
  user_id: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  verified: boolean | null;
  isOwner: boolean;
  // NEW FIELDS
  creator_tags: string[];
  niche: string; // Derived from primary tag or product types
  stats: {
    productCount: number;
    salesCount: string;
    avgRating: number;
  };
}
```

### Fallback for Missing Tags

Until creators self-label, derive categories from their product types:

```typescript
// Derive niche from products if no creator_tags
const deriveTags = async (creatorId: string): Promise<string[]> => {
  const { data: products } = await supabase
    .from('products')
    .select('product_type')
    .eq('creator_id', creatorId)
    .eq('status', 'published');
  
  // Map product_type to category
  const mapping: Record<string, string> = {
    'preset': 'video',
    'lut': 'video',
    'sfx': 'audio',
    'music': 'audio',
    'template': 'productivity',
    'overlay': 'video',
    'tutorial': 'education',
    'project_file': 'video',
    'digital_art': 'design',
    '3d_artist': '3d',
  };
  
  const tags = [...new Set(products?.map(p => mapping[p.product_type] || 'design'))];
  return tags.slice(0, 3);
};
```

---

## Filter & Search Logic

```typescript
const filteredCreators = creators.filter(creator => {
  // 1. Category match
  const matchesCategory = activeCategory === "all" || 
    creator.creator_tags.includes(activeCategory);
  
  // 2. Search match (name, handle, bio, niche)
  const q = searchQuery.toLowerCase();
  const matchesSearch = !searchQuery || 
    creator.full_name?.toLowerCase().includes(q) ||
    creator.username?.toLowerCase().includes(q) ||
    creator.bio?.toLowerCase().includes(q) ||
    creator.niche?.toLowerCase().includes(q);
  
  return matchesCategory && matchesSearch;
});
```

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/pages/Creators.tsx` | REWRITE | Complete rebuild with Hero, Category Nav, and CreatorCard |
| Database Migration | CREATE | Add `creator_tags` column to profiles table |

---

## Key Features

### 1. Hero Search Section
- Large headline: "Find your favorite Creator"
- Subtext with industry examples
- Centered search bar with glass effect
- Animated background orbs (matching Products page)

### 2. Sticky Category Navigation
- Horizontally scrollable on mobile
- 12 industry categories with icons
- Active state: white bg, black text, glow effect
- Sticks to top on scroll (sticky top-16)

### 3. Rich Creator Cards
- Cover banner with gradient overlay
- Avatar overlapping banner edge
- Verified + Owner badges
- Niche label (primary category)
- Self-labeled tag pills with icons
- Stats footer: Products, Sales, Rating

### 4. Smart Fallbacks
- Derive categories from product types if no self-labels
- Show "Creator" as default niche
- Use banner_url or gradient placeholder for covers

---

## Future Enhancements (Not in This Plan)

- Settings page for creators to self-select categories
- "Top Creators" featured section at the top
- Sorting options (by sales, by followers, by rating)
- "Following" filter for logged-in users
