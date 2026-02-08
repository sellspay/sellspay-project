
# Plan: Fix Public Visibility of Creators and Creator Profiles

## Problem Summary
Users who are **not signed in** cannot see:
1. Any creators on the `/creators` page
2. The creator's name/profile on product detail pages

**Root Cause**: The `public_profiles` view queries the `profiles` table, but the `profiles` table has RLS policies that **only allow users to see their own profile** or admins to see all. There is **no public SELECT policy** for anonymous users.

The network requests show `public_profiles` queries returning **empty arrays `[]`** even for valid profile IDs.

---

## Solution: Add Public Read Policy to Profiles Table

We need to add a new RLS policy that allows **anyone (including anonymous users)** to SELECT from the `profiles` table for profiles that are:
- Creators (`is_creator = true`), OR
- Verified (`verified = true`), OR  
- Editors (`is_editor = true`)

This matches the exact filter conditions of the `public_profiles` view, ensuring the view works correctly for unauthenticated users.

---

## Database Changes

### New RLS Policy on `profiles` Table:
```sql
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    is_creator = true OR 
    verified = true OR 
    is_editor = true
  );
```

This policy allows:
- Anonymous users (`anon` role) to view creator/verified/editor profiles
- Authenticated users to also view these profiles
- The conditions mirror the `public_profiles` view's WHERE clause

---

## Why This Is Safe

The `profiles` table already exposes only non-sensitive fields through the view:
- `id`, `user_id`, `username`, `full_name`
- `avatar_url`, `banner_url`, `bio`
- `is_creator`, `is_editor`, `verified`
- `website`, `social_links`, `creator_tags`
- Editor-related fields (rates, services, etc.)

No sensitive data (passwords, API keys, private settings) are stored in this table. These are public-facing profile fields intended to be visible on storefronts and creator pages.

---

## No Frontend Changes Required

The frontend code is already correct:
- `Creators.tsx` queries `public_profiles` correctly
- `ProductDetail.tsx` uses `public_profiles` to fetch creator info (line 467)
- `FeaturedCreators.tsx` queries `public_profiles` correctly

Once the RLS policy is added, all existing code will work for anonymous users.

---

## Technical Summary

| Item | Details |
|------|---------|
| **Change Type** | Database RLS policy |
| **Table Affected** | `profiles` |
| **Policy Name** | "Anyone can view public profiles" |
| **Operations** | SELECT only |
| **Roles** | `anon`, `authenticated` |
| **Condition** | `is_creator = true OR verified = true OR is_editor = true` |

---

## Expected Outcome

After this change:
- ✅ Anonymous users can browse the Creators page
- ✅ Anonymous users can see creator info on product pages
- ✅ Creator profiles are publicly accessible via `/@username` routes
- ✅ Featured creators section on homepage works for all visitors
