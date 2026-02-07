
# VibeCoder "Anti-Regression + State Desync" Full Implementation Plan

## Problem Summary

You're experiencing two critical issues that are destroying your workflow:

1. **Ghost Fix Button** — The "Fix This Now" button reappears on working projects after switching tabs because the success state isn't being synchronized with the database before you navigate away.

2. **Regression Loop** — When the AI performs a "Fix," it strips away complex animations and premium styling to pass build checks, resulting in "PDF-like" cheap templates instead of maintaining your high-end editorial design.

---

## Solution Architecture

I will implement a comprehensive system with three pillars:

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        ANTI-REGRESSION SYSTEM                        │
├──────────────────────────────────────────────────────────────────────┤
│  1. ATOMIC STATUS SYNC                                               │
│     └─ Promise.all() ensures DB write BEFORE preview render         │
│                                                                      │
│  2. ID-MATCHED STATE                                                 │
│     └─ Fix button logic verifies project_id matches URL             │
│                                                                      │
│  3. BLUEPRINT FIDELITY                                               │
│     └─ Heal agent is FORBIDDEN from removing components/animations  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Part 1: Atomic Status Sync (Kill the Ghost Fix Button)

**File: `src/components/ai-builder/SimpleVibecoderPage.tsx`**

The current flow saves code asynchronously, but the UI can switch projects before the save completes. I will:

- Wrap the database save + success flag update in a single `Promise.all()`
- Add a `lastSuccessfulProjectId` ref that tracks which project ID achieved success
- Only clear the error state after the database confirms the write

**Code Concept:**
```typescript
// BEFORE preview render, ensure database is updated
await Promise.all([
  supabase.from('project_files').upsert({ ... }),
  supabase.from('vibecoder_projects').update({ 
    is_broken: false, 
    last_success_at: new Date().toISOString() 
  }).eq('id', projectId)
]);

// NOW safe to update UI
setCode(codeToDeliver);
setError(null);
```

---

### Part 2: ID-Matched Error Display (Stop Cross-Project Errors)

**File: `src/components/ai-builder/SimplePreview.tsx`**

Currently, the `onFixError` callback doesn't validate that the error belongs to the active project. I will:

- Add a `projectId` prop to `SimplePreview`
- Store the error's source project ID alongside the error message
- Reject any error display if the stored project ID doesn't match `activeProjectId`

**Code Concept:**
```typescript
interface ErrorWithContext {
  message: string;
  sourceProjectId: string;
}

// In error handler:
if (errorContext.sourceProjectId !== activeProjectId) {
  console.log('[Preview] Ignoring stale error from project:', errorContext.sourceProjectId);
  return; // Silently discard
}
```

---

### Part 3: Blueprint Fidelity (Anti-Regression Protocol)

**File: `supabase/functions/vibecoder-heal/index.ts`**

The heal agent currently has free reign to "simplify" code. I will add explicit guardrails:

- Extract component names and animation keywords from the original code
- Add a "Blueprint Fidelity Check" that verifies the healed code contains all original components
- Reject healed code that removes Framer Motion, scroll animations, or glassmorphism effects

**System Prompt Addition:**
```
## BLUEPRINT FIDELITY PROTOCOL (MANDATORY)

You are performing a SURGICAL FIX. You may ONLY fix syntax errors.

FORBIDDEN ACTIONS:
- Removing components (if Hero exists in input, Hero MUST exist in output)
- Removing animation libraries (motion, AnimatePresence)
- Replacing complex layouts with simple stacked divs
- Reducing data arrays (if 8 products, output must have 8 products)

ALLOWED ACTIONS:
- Adding missing closing brackets/braces
- Fixing import syntax
- Correcting hook placement

If you cannot fix without removing features, return the original code unchanged.
```

---

### Part 4: Manual State Refresh Button

**File: `src/components/ai-builder/CanvasToolbar.tsx`**

I will add a "Refresh Project State" button that:

- Clears all localStorage for the current project
- Fetches fresh code from the database
- Force-resets the preview iframe

This gives you an escape hatch when the UI gets stuck.

---

### Part 5: Database Schema Addition

I will add an `is_broken` column to the `vibecoder_projects` table to persistently track project health state. This prevents the UI from "forgetting" that a project succeeded.

**Migration:**
```sql
ALTER TABLE vibecoder_projects 
ADD COLUMN IF NOT EXISTS is_broken BOOLEAN DEFAULT FALSE;

ALTER TABLE vibecoder_projects 
ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-builder/SimpleVibecoderPage.tsx` | Atomic status sync, ID-matched error handling, refresh button trigger |
| `src/components/ai-builder/SimplePreview.tsx` | Add `projectId` prop, validate errors against active project |
| `src/components/ai-builder/CanvasToolbar.tsx` | Add "Refresh State" button |
| `src/hooks/useProjectScopedState.ts` | Add `refreshFromDatabase()` method |
| `supabase/functions/vibecoder-heal/index.ts` | Blueprint Fidelity Protocol in system prompt |
| Database migration | Add `is_broken` and `last_success_at` columns |

---

## Expected Outcome

After implementation:

- Switching projects will no longer show phantom "Fix This Now" buttons
- The AI will be forbidden from stripping animations and complexity during fixes
- You will have a manual "Refresh State" button as an emergency escape hatch
- Project health status will persist in the database, surviving page refreshes

---

## Technical Notes

- The `Promise.all()` pattern ensures atomicity — if the DB write fails, the UI won't falsely show success
- The Blueprint Fidelity check happens inside the heal agent's response validation, not just the prompt
- The `is_broken` column creates a source-of-truth that survives browser cache clears
