
# Plan: Fix Credit Check Flickering with Global Cache

## Problem Analysis

The current credit system causes flickering because:

1. **Isolated State**: `useCredits` uses `useState` which creates independent state per component
2. **Multiple Fetch Calls**: Both Header and Tools page call `useCredits()` → each triggers its own API call
3. **Race Condition**: When navigating to Tools, the hook initializes with `creditBalance: 0` and `isLoading: true`, shows 0 briefly, then updates after API responds

```text
Current Flow:
┌──────────────┐     ┌──────────────┐
│    Header    │     │  Tools Page  │
│ useCredits() │     │ useCredits() │
│    ↓         │     │     ↓        │
│ Fetch API    │     │  Fetch API   │ (separate calls!)
│    ↓         │     │     ↓        │
│ State: 50    │     │ State: 0 → 50│ (flicker!)
└──────────────┘     └──────────────┘
```

---

## Solution: React Query Global Cache

Convert `useCredits` to use React Query which provides:
- **Global cache** shared across all components
- **Stale-while-revalidate** - shows cached data immediately
- **Single source of truth** - no duplicate API calls
- **Configurable refetch** - only refresh when needed

```text
New Flow:
┌──────────────┐     ┌──────────────┐
│    Header    │     │  Tools Page  │
│ useCredits() │     │ useCredits() │
│    ↓         │     │     ↓        │
│ Query: credits│←───→│ Query: credits│ (shared cache!)
│    ↓         │     │     ↓        │
│ State: 50    │     │ State: 50    │ (instant!)
└──────────────┘     └──────────────┘
         ↓
    ┌────────────┐
    │ React Query│
    │   Cache    │
    └────────────┘
```

---

## Implementation Details

### 1. Refactor `useCredits.ts` to Use React Query

Replace `useState` + `useEffect` pattern with `useQuery`:

```typescript
// Credit balance query - cached globally
const { 
  data: creditData, 
  isLoading: creditsLoading,
  refetch: refetchCredits 
} = useQuery({
  queryKey: ['user-credits', user?.id],
  queryFn: async () => {
    const { data } = await supabase.functions.invoke("check-credits");
    return data?.credit_balance ?? 0;
  },
  enabled: !!user,
  staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch if data is fresh
  gcTime: 10 * 60 * 1000,   // 10 minutes cache
});
```

### 2. Cache Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| `staleTime` | 5 minutes | Data considered fresh, no background refetch |
| `gcTime` | 10 minutes | Keep in cache even when unmounted |
| `enabled` | `!!user` | Only fetch when logged in |
| `refetchOnMount` | false | Don't refetch if cache exists |
| `refetchOnWindowFocus` | false | Don't refetch when returning to tab |

### 3. Manual Refresh Only When Needed

Credits should only refresh after:
- **Deducting a credit** (using a tool)
- **Purchasing credits** (checkout completion)
- **Login/logout** (user change)

The `deductCredit` and `verifyPurchase` functions will call `queryClient.invalidateQueries(['user-credits'])` to force refresh.

### 4. Subscription Query (Same Pattern)

Apply the same caching to subscription status.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCredits.ts` | Replace useState/useEffect with useQuery for credits and subscription |

---

## Technical Changes Summary

```text
Before:
- useState({ creditBalance: 0, isLoading: true })
- useEffect → checkCredits() (runs on every mount)
- Multiple API calls per page navigation

After:
- useQuery(['user-credits'], checkCredits, { staleTime: 5min })
- Cached globally, shared across components
- Single API call, instant display on navigation
```

---

## Result

- **No flicker**: Cached balance displays instantly when navigating to Tools
- **One-time fetch**: Initial load fetches, subsequent navigations use cache
- **Auto-refresh after actions**: Credits update after purchases/usage
- **Better performance**: Fewer API calls, faster page loads
