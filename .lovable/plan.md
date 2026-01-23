
# Implementation Plan

## Summary
This plan addresses 5 interconnected issues to improve the user experience across the platform:

1. **Wallet placement in navbar** - Move wallet display next to the profile icon
2. **Tools page layout** - Remove hero banner and make the page static (no scroll except tools menu)
3. **Creators page visibility** - Fix RLS policies so creators are publicly visible
4. **Hire Editors page visibility** - Fix RLS policies so editors are publicly visible  
5. **Pricing card redesign** - Make the pricing card smaller and more premium looking

---

## Issue Analysis

### Issue 1: Wallet Position
The wallet counter was added next to the profile icon in the navbar (Header.tsx), which looks correct based on the screenshot showing the wallet icon with "5" next to the profile avatar. This appears to already be working correctly.

### Issue 2: Tools Page Scrolling
The current Tools page has a large hero section that takes up significant vertical space, requiring users to scroll to see all tools. The user wants:
- Remove the hero banner entirely
- Make the page fit within the viewport (no page scroll)
- Only the tools sidebar menu should scroll internally

### Issue 3 & 4: Creators/Editors Not Visible
The profiles table RLS policies are too restrictive:
- Current SELECT policies: Only allows users to view their OWN profile, or admins to view all
- Missing: A public SELECT policy for creator/editor profiles

This is why both pages show "0 creators/editors found" - unauthenticated users or regular buyers cannot query the profiles table at all.

### Issue 5: Pricing Card Design
The current pricing card is functional but could be more compact and premium. The user wants a smaller, more refined design.

---

## Implementation Steps

### Phase 1: Database - Fix Public Profile Visibility

Add a new RLS policy to allow anyone to view public creator/editor profiles:

```sql
CREATE POLICY "Public can view creator and editor profiles"
  ON public.profiles FOR SELECT
  USING (is_creator = true OR is_editor = true);
```

This policy allows:
- Anyone (authenticated or not) to view profiles where `is_creator = true` or `is_editor = true`
- Regular user profiles remain private (not matching either condition)
- Maintains security for non-creator/editor profiles

### Phase 2: Tools Page - Remove Hero and Static Layout

**File: `src/pages/Tools.tsx`**

1. Remove the entire hero header section (lines 17-59)
2. Change the main container to use `h-screen` and `overflow-hidden` 
3. Make the layout fill the available viewport height minus the header
4. Keep ScrollArea only on the sidebar tools list
5. Result: Full-screen two-column layout with no page scrolling

Changes:
- Remove: Hero section with gradient, badge, headline, subtitle, floating icons
- Add: `h-[calc(100vh-4rem)]` to create fixed-height container
- Add: `overflow-hidden` to prevent page scroll
- Keep: Internal scroll on sidebar for tools list

### Phase 3: Pricing Page - Compact Premium Design

**File: `src/pages/Pricing.tsx`**

1. Reduce card max-width from `max-w-xl` to `max-w-md`
2. Reduce internal padding and spacing
3. Add subtle glass-morphism effect with backdrop blur
4. Refine typography with smaller font sizes
5. Add subtle gradient border effect
6. Reduce the "What You Unlock" section to be more compact
7. Remove some redundant visual elements

Key changes:
- Smaller card container
- Tighter spacing between elements
- More refined, minimal aesthetic
- Keep all functionality intact

### Phase 4: Verify Wallet Placement

The wallet is already positioned correctly next to the profile icon based on the code review. The implementation shows:
- Desktop: Wallet button with icon + balance displayed inline, followed by profile avatar
- Mobile: Wallet displayed inside the dropdown menu

No changes needed here - the current implementation matches the requested design.

---

## Technical Details

### RLS Policy Addition

```sql
-- Allow public viewing of creator/editor profiles
CREATE POLICY "Public can view creator and editor profiles"
  ON public.profiles FOR SELECT
  USING (is_creator = true OR is_editor = true);
```

This is safe because:
- Only exposes profiles explicitly marked as creators or editors
- Regular user profiles remain protected
- Sensitive fields should be handled at the application level if needed

### Tools Page Structure

```text
+------------------+
|     Header       |  (fixed, 4rem)
+--------+---------+
|        |         |
| Tools  | Content |
| List   | Area    |
|(scroll)|         |
|        |         |
+--------+---------+
```

- Total height: `100vh - header height`
- Sidebar: Internal scroll for tool items only
- Content: Fixed, no scroll needed

### Pricing Card Refinements

- Width: `max-w-md` (448px) instead of `max-w-xl` (576px)
- Padding reduced by ~25%
- Glass effect: `bg-card/80 backdrop-blur-xl`
- Border: Gradient or subtle glow effect
- Typography: Slightly smaller headings

---

## Files to Modify

| File | Changes |
|------|---------|
| Database (migration) | Add public SELECT policy for creator/editor profiles |
| `src/pages/Tools.tsx` | Remove hero, add fixed-height layout |
| `src/pages/Pricing.tsx` | Smaller card, refined styling |

---

## Expected Results

After implementation:
1. **Creators page**: Will display all creator profiles to any visitor
2. **Hire Editors page**: Will display all editor profiles to any visitor
3. **Tools page**: Clean, full-viewport layout with no page scrolling
4. **Pricing page**: Compact, premium-looking subscription card
5. **Navbar wallet**: Already correctly positioned (no change needed)
