
# Plan: Display Updates as "EditorsParadise" Bot

## Overview

Transform the Updates page so all announcements appear to come from a platform bot called **"EditorsParadise"** instead of showing the owner's personal profile. This creates a more professional, official appearance for platform announcements.

---

## Current vs. New Behavior

| Aspect | Current | New |
|--------|---------|-----|
| **Display Name** | Owner's username | "EditorsParadise" |
| **Avatar** | Owner's profile picture | Platform logo (navbar-logo.png) |
| **Badge** | Owner verified badge | "BOT" badge + verified badge |
| **Author Fetching** | Queries profiles table | Not needed (hardcoded) |

---

## Implementation Details

### 1. Update `UpdateCard.tsx`

Replace the dynamic author display with a hardcoded "EditorsParadise" bot identity:

- **Avatar**: Use the navbar logo (`/src/assets/navbar-logo.png`) 
- **Name**: Display "EditorsParadise" as the bot name
- **Badge**: Add a special "BOT" badge (similar to Discord's bot badges) in addition to the verified badge
- **Remove**: No longer need to pass or display author profile data

### 2. Update `Updates.tsx` 

Simplify the data fetching:
- Remove the author profile fetching logic since we no longer need it
- Keep only the platform_updates query without joining profiles

### 3. Visual Design for Bot Identity

```text
+-------------------------------------------+
| [Logo]  EditorsParadise  [BOT] [✓]        |
|         2 hours ago                        |
+-------------------------------------------+
```

- **BOT Badge**: Small pill badge with "BOT" text in amber/gold color
- **Verified Badge**: Keep the animated owner verified badge for official status
- **Avatar Ring**: Amber glow ring around the logo

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/community/UpdateCard.tsx` | Replace author display with hardcoded bot identity |
| `src/pages/community/Updates.tsx` | Remove author fetching logic (simplify query) |

---

## Code Changes Summary

### UpdateCard.tsx
- Import the navbar logo
- Replace Avatar with the platform logo
- Replace username with "EditorsParadise"
- Add "BOT" badge next to the name
- Remove author prop dependency (keep author_id for internal use only)

### Updates.tsx
- Remove the `Promise.all` author fetching loop
- Simplify query to just fetch from `platform_updates`
- Remove author from the interface/type

---

## Visual Result

All updates will display with:
- **EditorsParadise** platform logo as avatar
- **"EditorsParadise"** as the display name
- **"BOT"** badge in amber/gold styling
- **Verified owner badge** (animated rainbow)
- Clean, professional, official appearance

This matches the Discord bot style where automated messages come from a clearly identified bot account rather than a personal user.
