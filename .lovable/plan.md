
# Mobile UI Fixes for Community, Header, and Settings

## Overview

This plan addresses three mobile-specific UI issues:
1. **Community nav buttons cut off** - Can't see all buttons including FAQ
2. **Missing Sign In button on mobile** - Only "Join free" visible for logged-out users
3. **Settings tabs completely broken** - Can't click tabs, not organized for mobile

---

## 1. Community Navigation - Fix Button Overflow

**File:** `src/components/community/CommunityNav.tsx`

**Current Problem:**
- Navigation container has `overflow-x-auto` but the wrapper doesn't properly enable horizontal scrolling
- All 5 buttons with full text labels exceed mobile screen width
- FAQ button gets cut off

**Solution:**
- On mobile, show only icons (hide labels) to make buttons fit
- Add proper horizontal scroll container with touch gestures
- Add left/right padding to allow first/last items to be fully visible when scrolled

**Changes:**
- Update nav container to use proper full-width scrollable container
- Add `touch-pan-x` for smooth mobile swiping
- Show labels only on `sm:` breakpoint and above
- Use smaller padding and gap on mobile

---

## 2. Header - Add Sign In Button for Mobile

**File:** `src/components/layout/Header.tsx`

**Current Problem:**
- Line 207: "Sign In" button has `hidden sm:inline-flex` - completely hidden on mobile
- Users only see "Join free", creating confusion for returning users

**Solution:**
- Remove `hidden sm:inline-flex` class from Sign In button
- Make both buttons visible on mobile with adjusted sizing
- Add proper spacing for mobile layout

**Changes:**
- Change Sign In button from `hidden sm:inline-flex` to always visible
- Adjust button text size for mobile (`text-xs`)
- Ensure both "Sign In" and "Join free" are accessible

---

## 3. Settings Page - Complete Mobile Redesign

**File:** `src/pages/Settings.tsx`

**Current Problem:**
- TabsList uses `grid w-full grid-cols-6` - forces 6 tiny columns on mobile
- Each tab shows icon + text, making them impossibly narrow
- Users cannot tap or read the tabs on mobile

**Solution:**
- On mobile: Stack tabs vertically or use horizontal scroll with icon-only buttons
- Use responsive grid: 2 columns on mobile, 6 on desktop
- Show icon-only on mobile, icon + text on larger screens

**Changes:**
- Update TabsList: `grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6`
- Update TabsTrigger: Hide text on mobile with `hidden sm:inline`
- Reduce icon size on mobile for better spacing
- Add proper gap and padding for touch targets

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/community/CommunityNav.tsx` | Icon-only on mobile, horizontal scroll container with touch support |
| `src/components/layout/Header.tsx` | Show "Sign In" button on mobile by removing `hidden sm:inline-flex` |
| `src/pages/Settings.tsx` | Responsive tabs grid (2 cols mobile, 6 cols desktop), icon-only on mobile |

---

## Expected Result

- **Community:** All 5 nav buttons visible and accessible, FAQ button fully visible
- **Header:** Both "Sign In" and "Join free" visible on mobile for logged-out users
- **Settings:** All 6 tabs easily tappable with clear icons, organized in 2-column grid on mobile
