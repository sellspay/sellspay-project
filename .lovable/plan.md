
# Home Page Error Elimination Plan -- Every Error Fixed

## Problem Summary
The home page shows 39 errors + 11 warnings + 3 info in the console. After tracing every single one through the source code and network requests, they all come from just **4 root causes** that multiply across every rendered component instance.

---

## Error-by-Error Breakdown

### ERROR GROUP 1: "Function components cannot be given refs" (accounts for ~16-20 errors)

**What's happening:** `VerifiedBadge` is a plain function component. Radix UI's `TooltipTrigger` with `asChild` tries to forward a ref to its child -- but `VerifiedBadge` can't accept refs. React fires **2 warnings per instance**: one from the parent component, one from `Tooltip` itself.

**Where it fires:**
- `FeaturedCreators` renders up to 8 creator cards, each with a `VerifiedBadge` = ~16 warnings
- Any other page component using `VerifiedBadge` adds more

**File:** `src/components/ui/verified-badge.tsx`
**Fix:** Wrap `VerifiedBadge` in `React.forwardRef` and forward the ref to the outer `<Tooltip>` wrapper div.

---

### ERROR GROUP 2: Per-card individual API calls causing React warnings (~12-18 errors)

**What's happening:** Every single `ProductCard` on the home page independently runs 3 Supabase queries inside `useEffect`:
1. `profiles` -- to get the logged-in user's profile ID
2. `saved_products` -- to check if this product is saved
3. `public_profiles` -- to fetch the creator's username (when `showCreator=true`)

With 12 product cards, that's **36 individual API calls** on page load. This causes:
- React state-update-on-unmounted-component warnings (if cards unmount during loading)
- Waterfall loading that creates jank

**File:** `src/components/ProductCard.tsx`
**Fix:** 
- Move the user profile ID fetch OUT of ProductCard -- pass it as a prop or use a shared context
- Batch the creator lookups at the grid level (the parent already has `creator_id`)
- Move saved-product check to use a single bulk query at the grid level

---

### ERROR GROUP 3: Duplicate `has_role` RPC calls (8 calls, ~4-6 warnings)

**What's happening:** `has_role` is called independently by:
- `AuthProvider` (2 calls: admin + owner)
- `NotificationBell` (1 call: admin check)
- `useSubscription` via `check-subscription` edge function (triggers internal role check)
- Some re-render cycles cause these to fire again

Total: **8 `has_role` calls** visible in network. Each one that overlaps with another creates a potential warning.

**Files:** `src/lib/auth.tsx`, `src/components/notifications/NotificationBell.tsx`
**Fix:** 
- `NotificationBell` already has access to `useAuth()` which provides `isAdmin` -- remove the duplicate `has_role` RPC call and use `isAdmin` from auth context instead

---

### ERROR GROUP 4: Duplicate `check-subscription` edge function calls (2 calls)

**What's happening:** `useSubscription` has two `useEffect` hooks that can both trigger `refreshSubscription`:
1. The initial fetch effect (line 273)
2. The admin privilege sync effect (line 291)

When `isPrivileged` becomes `true` (after auth loads), both effects fire, causing 2 calls.

**File:** `src/hooks/useSubscription.ts`
**Fix:** Consolidate the two effects into one that handles both initial fetch and privilege sync. Use the existing `fetchedRef` to prevent double-fires.

---

## Implementation Steps

### Step 1: Fix `VerifiedBadge` with `forwardRef` (kills ~16-20 errors)

Update `src/components/ui/verified-badge.tsx`:
- Wrap the component with `React.forwardRef`
- Forward the ref to the outermost wrapper `<div>` inside `TooltipTrigger`
- This is the single biggest win -- eliminates roughly half of all errors

### Step 2: Optimize `ProductCard` API calls (kills ~12-18 errors)

Update `src/components/ProductCard.tsx`:
- Remove the `useEffect` that fetches `profiles` to get user profile ID -- use `useAuth()` profile.id directly (it's already available)
- Remove the per-card creator fetch -- accept creator data as a prop instead
- Keep the saved-product check but debounce it / make it use the profile ID from auth context

Update `src/pages/Home.tsx` (`MassiveProductGrid`):
- Pass creator data from the parent level since we already have `creator_id`

### Step 3: Remove duplicate `has_role` from `NotificationBell` (kills ~2-4 errors)

Update `src/components/notifications/NotificationBell.tsx`:
- Replace the manual `supabase.rpc("has_role", ...)` call with `const { isAdmin } = useAuth()`
- The auth context already provides this value -- no need to fetch it again

### Step 4: Fix duplicate `check-subscription` calls (kills 1 duplicate call)

Update `src/hooks/useSubscription.ts`:
- Merge the two `useEffect` hooks (lines 273 and 291) into a single effect
- Use `fetchedRef` properly to prevent the privilege sync from re-fetching when the initial fetch already handled it

### Step 5: Fix `ProductCard` user profile lookup (kills ~8 redundant calls)

Update `src/components/ProductCard.tsx`:
- Instead of each card querying `profiles` table to find `userProfileId`, derive it from `useAuth().profile.id`
- This eliminates 12 identical `profiles` queries that all return the same result

---

## Files to Modify

| File | What Changes | Errors Killed |
|------|-------------|---------------|
| `src/components/ui/verified-badge.tsx` | Add `forwardRef` wrapper | ~16-20 |
| `src/components/ProductCard.tsx` | Use auth context for profile ID, accept creator as prop | ~12-18 |
| `src/components/notifications/NotificationBell.tsx` | Use `isAdmin` from auth context | ~2-4 |
| `src/hooks/useSubscription.ts` | Merge duplicate useEffect hooks | ~1-2 |
| `src/pages/Home.tsx` | Pass creator data to ProductCard from parent | 0 (supports Step 2) |

## Expected Result
- **0 errors** from `forwardRef` warnings
- **0 redundant per-card API calls**
- **~60% fewer network requests** on home page load
- Error counter should drop from 39 to 0

## What This Does NOT Touch
- No database changes needed
- No edge function changes needed
- No changes to the AI builder or vibecoder pipeline
- Styling and layout remain identical
