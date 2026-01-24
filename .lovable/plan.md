

# Plan: Owner-Only Updates Tab with MonitoRSS Integration

## Overview

You want to add an "Updates" tab to the Community section where only the **Owner** can post platform announcements (privacy changes, terms updates, new features, etc.). This should have a premium forum-style design and generate an **RSS/Atom feed** that MonitoRSS can consume to push updates to your Discord channel.

---

## Architecture

```text
+------------------+     +------------------+     +------------------+
|   Updates Page   | --> | platform_updates | --> | RSS/Atom Feed    |
|   (Owner Only)   |     | (New Table)      |     | Edge Function    |
+------------------+     +------------------+     +------------------+
                                                         |
                                                         v
                                              +------------------+
                                              | MonitoRSS Bot    |
                                              | (Discord)        |
                                              +------------------+
```

---

## Implementation Details

### 1. Database: New `platform_updates` Table

A dedicated table for platform updates (separate from regular threads):

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `author_id` | uuid | References profiles (owner) |
| `title` | text | Update title (e.g., "New Privacy Policy") |
| `content` | text | Full announcement content (Markdown) |
| `category` | text | Update type: `announcement`, `privacy`, `terms`, `feature`, `maintenance` |
| `is_pinned` | boolean | Pin important updates |
| `created_at` | timestamp | When posted |

RLS Policy: Only users with `owner` role can INSERT/UPDATE/DELETE. Public SELECT for everyone.

### 2. New Community Tab: `/community/updates`

Add an "Updates" tab to the CommunityNav component with:
- Premium forum-style design matching the "Million Dollar" aesthetic
- Icon: Megaphone or Bell icon
- Special gold/amber accent colors to distinguish official announcements

### 3. Updates Page Design (Premium Forum Style)

- **Hero Section**: Floating badge "Official Updates", gradient orbs, glassmorphism
- **Update Cards**: Each update displayed as a premium card with:
  - Category badge (color-coded: Privacy = Blue, Terms = Purple, Feature = Green, etc.)
  - Title and excerpt
  - Full content expandable/modal
  - Owner badge next to author
  - Timestamp with relative formatting
  - Pin indicator for important updates
- **Owner Composer**: Visible only to Owner role
  - Title input
  - Category selector dropdown
  - Rich text/Markdown content area
  - Pin toggle
  - "Publish Update" button

### 4. RSS/Atom Feed Endpoint

Create an Edge Function at `/functions/v1/rss-updates` that generates a valid Atom feed:

```xml
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>EditorsParadise Platform Updates</title>
  <link href="https://editorsparadise.com/community/updates"/>
  <updated>2026-01-24T22:00:00Z</updated>
  <author>
    <name>EditorsParadise</name>
  </author>
  <id>urn:uuid:editorsparadise-updates</id>
  
  <entry>
    <title>New Privacy Policy Update</title>
    <link href="https://editorsparadise.com/community/updates#update-123"/>
    <id>urn:uuid:update-123</id>
    <published>2026-01-24T20:00:00Z</published>
    <updated>2026-01-24T20:00:00Z</updated>
    <category term="privacy"/>
    <summary>Important changes to our Privacy Policy...</summary>
    <content type="html">Full HTML content here...</content>
  </entry>
</feed>
```

### 5. MonitoRSS Integration

Once the feed is live, you'll configure MonitoRSS with:
- **Feed URL**: `https://id-preview--b4266a1f-6170-45f6-8702-98af3722d170.lovable.app/functions/v1/rss-updates`
- Point it to your Discord channel for platform announcements
- MonitoRSS will poll the feed and post new updates automatically

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/community/Updates.tsx` | Updates page with premium design |
| `src/components/community/UpdateCard.tsx` | Individual update display card |
| `src/components/community/UpdateComposer.tsx` | Owner-only compose form |
| `supabase/functions/rss-updates/index.ts` | Atom feed generator |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/community/CommunityNav.tsx` | Add "Updates" tab |
| `src/App.tsx` | Add `/community/updates` route |

### Database Migration

```sql
-- New table for platform updates
CREATE TABLE public.platform_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'announcement',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view updates"
ON public.platform_updates FOR SELECT
TO anon, authenticated
USING (true);

-- Owner-only write access (uses has_role function)
CREATE POLICY "Only owner can create updates"
ON public.platform_updates FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Only owner can update updates"
ON public.platform_updates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owner can delete updates"
ON public.platform_updates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));
```

---

## Category Types and Colors

| Category | Color | Icon | Description |
|----------|-------|------|-------------|
| `announcement` | Amber/Gold | Megaphone | General announcements |
| `privacy` | Blue | Shield | Privacy policy changes |
| `terms` | Purple | FileText | Terms of Service updates |
| `feature` | Emerald | Sparkles | New feature releases |
| `maintenance` | Gray | Wrench | Scheduled maintenance |

---

## UI/UX Design Details

### Update Card (Premium Forum Style)
- Glassmorphism background with subtle gradient
- Category badge (pill-shaped, color-coded)
- Large bold title
- Content preview (first 150 chars) with "Read more"
- Owner avatar with animated rainbow verified badge
- Relative timestamp ("2 hours ago")
- Pin indicator (sticky icon for pinned updates)

### Composer (Owner Only)
- Full-width card with premium styling
- Title input with placeholder "Update Title..."
- Category dropdown selector
- Large text area for content (supports Markdown)
- "Pin this update" toggle switch
- Gradient "Publish Update" button

---

## MonitoRSS Setup Instructions

After implementation, configure MonitoRSS:

1. Go to MonitoRSS dashboard
2. Add new feed with URL: `https://your-domain.lovable.app/functions/v1/rss-updates`
3. Set feed title: "EditorsParadise Updates"
4. Configure output channel in Discord
5. Customize message format (optional)
6. MonitoRSS checks every few minutes and posts new entries

---

## Summary

| Component | Details |
|-----------|---------|
| New Table | `platform_updates` with owner-only write RLS |
| New Page | `/community/updates` with premium forum design |
| New Tab | "Updates" in CommunityNav with Megaphone icon |
| Edge Function | `/rss-updates` generating valid Atom XML |
| Access Control | Owner role only for posting (via `has_role` RPC) |
| Integration | Atom feed compatible with MonitoRSS |

