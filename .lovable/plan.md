

# Audit Report: ZERO-TRUST Commit Gate

## Status: ALREADY HARDENED

The previous three rounds of fixes have successfully implemented all five requirements. The current code is correct and non-destructive. This plan covers the minor cleanup items discovered during the audit.

---

## Audit Findings

### 1. Non-Destructive Failures -- PASS
All failure branches (Layers 1-6, truncation, error handler) call `abortGeneration()` which only clears locks, live steps, and resets the agent. **No failure path calls `setFiles()`.**

### 2. Atomic DB-First Commit -- PASS
Success path order:
1. DB persist (lines 209-227) -- if fails, aborts without sandbox mutation
2. `setFiles(fileMap)` (line 230) -- only after DB confirms
3. `hasDbSnapshotRef.current = true` (line 231) -- transitions to MERGE mode

### 3. MERGE/REPLACE Mode -- PASS
`hasDbSnapshotRef` only flips to `true` after the first successful DB+sandbox commit. First generation uses REPLACE; all subsequent use MERGE.

### 4. Transpile Validator -- PASS
Catches: unbalanced delimiters, unterminated strings/template literals, truncation artifacts, malformed `url()` nesting. Applied before any commit.

---

## Cleanup Items (minor)

### A. Remove dead `getLastValidSnapshot` from controller
It is declared in the options interface and destructured but **never called** inside the hook. Removing it eliminates confusion about whether snapshot restore logic still exists.

**Files:** `useBackgroundGenerationController.ts`
- Remove `getLastValidSnapshot` from the `BackgroundGenerationControllerOptions` interface
- Remove it from the destructured parameters

**Files:** `AIBuilderCanvas.tsx`
- Remove `getLastValidSnapshot` from the props passed to the controller

### B. Remove stale dependency array entries
- `handleJobComplete` dependency array includes `setCode` -- never used in the callback
- `handleJobError` dependency array includes `setFiles` -- never used in the callback

**File:** `useBackgroundGenerationController.ts`
- Remove `setCode` from `handleJobComplete` deps (line 259)
- Remove `setFiles` from `handleJobError` deps (line 304)

### C. Remove `setCode` from options interface
`setCode` is declared in the interface (line 12), destructured (line 29), listed in deps, but **never called** anywhere in the hook. Dead code.

---

## Technical Summary

```text
FAILURE PATH (any of 6 layers, truncation, or error):
  toast.error(...)
  abortGeneration()    // clears locks + resets agent
  return               // sandbox untouched

SUCCESS PATH (all 6 layers pass):
  await DB.update(fileMap)   // source of truth first
    |-- fail? abort, return  // no sandbox mutation
    |-- pass? continue
  setFiles(fileMap)          // sandbox reflects DB
  hasDbSnapshotRef = true    // MERGE mode enabled
```

No snapshot surgery. No restore-on-failure. The sandbox is only ever written to on confirmed success.

