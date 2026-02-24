

# Kill the Hydration Reset Loop

## Problem
After successful generation + commit, `activeProjectId` transiently becomes `null`, triggering the Scorched Earth orchestrator which nukes Sandpack, resets `contentProjectId`, and flips `hasDbSnapshotRef` to `false` -- causing a Hello World fallback.

## Changes (all in `src/components/ai-builder/hooks/useProjectHydration.ts`)

### Fix 1: Null Guard on Layout Effect (line 121-127)
Replace the current guard logic with a null-first check. If `activeProjectId` is null, the layout effect does nothing -- no Scorched Earth, no cleanup, no state wipe.

**Before:**
```typescript
if (previousProjectIdRef.current === activeProjectId && previousProjectIdRef.current !== null) {
  return;
}
```

**After:**
```typescript
if (!activeProjectId) return;
if (previousProjectIdRef.current === activeProjectId) return;
```

### Fix 2: Move `previousProjectIdRef` Assignment Before Async Work (line 152)
Move `previousProjectIdRef.current = activeProjectId` from inside `loadRoute()` (line 152) to immediately after the guards (before line 129). This prevents re-entry if a re-render fires while the async DB fetch is in-flight.

### Fix 3: Conditional `hasDbSnapshotRef` Reset (line 133)
Instead of unconditionally resetting `hasDbSnapshotRef.current = false`, only reset it on a confirmed real project switch (both old and new IDs are non-null and differ).

**Before:**
```typescript
hasDbSnapshotRef.current = false;
```

**After:**
```typescript
if (previousProjectIdRef.current && previousProjectIdRef.current !== activeProjectId) {
  hasDbSnapshotRef.current = false;
}
```

Note: this check uses `previousProjectIdRef` before it gets updated (Fix 2 moves the assignment after this block).

### Fix 4: Delete Duplicate DB Fetch Effect (lines 228-261)
Remove the entire second `useEffect` that re-fetches `last_valid_files`. The layout effect already fetches `last_valid_files` and sets `hasDbSnapshotRef`. This duplicate creates a race condition that can flip `hasDbSnapshotRef` back to `false`.

Instead, populate `dbLastValidFilesRef` directly inside the layout effect's success handler (where `data.last_valid_files` is already available), and set `dbSnapshotReady` to `true` at the end of `loadRoute()`.

The restoration effect (lines 263-310) continues to work unchanged -- it reads from `dbLastValidFilesRef` and gates on `dbSnapshotReady`, both of which are now set by the single layout effect.

### Summary of line-level changes

1. Lines 121-127: Replace guard with null-first check
2. Line 129 (new): Insert `previousProjectIdRef.current = activeProjectId` right after guards
3. Line 133: Conditional snapshot reset instead of unconditional
4. Line 152: Remove the old `previousProjectIdRef.current = activeProjectId` (moved up)
5. Lines 190-203: Add `dbLastValidFilesRef.current = ...` and `setDbSnapshotReady(true)` in the DB success handler
6. Lines 206-207: Add `setDbSnapshotReady(true)` after zombie path too
7. Lines 228-261: Delete entire duplicate fetch effect
8. Remove `dbSnapshotReady` state setter from the deleted effect; keep the `useState` declaration since the restoration effect still reads it

