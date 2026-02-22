
# Reliable Multi-File Generation + Auto-Repair Pipeline

## Overview

This overhaul addresses 6 interconnected problems by making 3 core architectural changes: (1) switch code output from raw streaming deltas to atomic JSON file maps, (2) add auto-repair on validation failure, and (3) fix the false denial from overly aggressive layout enforcement.

## Problem Diagnosis

| Symptom | Root Cause |
|---------|------------|
| "storefront preserved" on valid requests | `code_chunk` deltas get truncated mid-stream, causing bracket imbalance in `validateTsx()` |
| No file tabs in Sandpack | System prompt outputs single monolithic TSX; `processContent()` treats `=== CODE ===` as one blob |
| False denial (promo banner blocked) | `enforceHeroFirstLayout()` in `validateTsx` flags any `<nav>/<header>` before a `hero` className, even when the element isn't navigation |
| Project code vanishes after reload | `files_snapshot` is never populated because multi-file output never happens; only `code_snapshot` (single string) is saved |
| Validation failures loop forever | No auto-repair: if validation fails, user sees error with no recovery |
| Analyzer suggestions not reaching chips | Already wired but the analyzer `analysis` object isn't passed into the main SSE stream (it's scoped to the question-branch only) |

## Changes

### 1. Backend: JSON Files Output Format

**File:** `supabase/functions/vibecoder-v2/index.ts`

**A) Update CODE_EXECUTOR_PROMPT** (lines ~697-725)

Replace the structured response format instructions so the `=== CODE ===` section contains a JSON file map instead of raw TSX:

```
=== CODE ===
{
  "files": {
    "/App.tsx": "import React from 'react';\nimport { NavBar } from './components/NavBar';\n...",
    "/components/NavBar.tsx": "export function NavBar() { ... }",
    "/sections/Hero.tsx": "export function Hero() { ... }"
  }
}
```

Add explicit file structure rules:
- `/App.tsx` is the router/compositor (imports components, never contains full sections inline)
- `/components/*.tsx` for reusable UI (NavBar, Footer, ProductCard)
- `/sections/*.tsx` for page sections (Hero, Products, FAQ)
- Each file must be a valid standalone React component with its own imports
- NO markdown fences inside the JSON values
- The sentinel `// --- VIBECODER_COMPLETE ---` goes inside `/App.tsx` content only

**B) Replace `processContent()` CODE section** (lines 1844-1861)

Instead of streaming raw code deltas, accumulate the `=== CODE ===` section and only emit once the `=== SUMMARY ===` marker appears (meaning the JSON is complete):

```text
When === SUMMARY === is detected:
  1. Extract the text between === CODE === and === SUMMARY ===
  2. Strip markdown fences if present
  3. JSON.parse() the content
  4. If parse succeeds: emit `event: files` with { projectFiles: parsed.files }
  5. If parse fails: emit `event: code_chunk` with raw content (legacy fallback)
```

During streaming (before SUMMARY marker), emit a progress indicator instead of partial code:
```text
event: code_progress
data: { "bytes": 1234 }
```

This prevents partial/broken code from ever reaching the frontend.

**C) Pass analyzer suggestions into the main stream** (around line 1660)

The current code runs the analyzer but only uses its results in the question-branch. When no questions are needed, the suggestions are lost. Fix: store `analysis.suggestions` in a variable and emit them in the main SSE stream's `start()` function.

### 2. Backend: Auto-Repair on Validation Failure

**File:** `supabase/functions/vibecoder-v2/index.ts` (new function + integration in finalization)

After JSON parse of the files map, validate each `.tsx` file using the same structural checks. If any file fails:

1. Call Gemini (gemini-2.5-flash, fast/free) with a repair prompt:
   - Include the broken file content
   - Include the exact validation error (reason + line)
   - Ask it to return ONLY the corrected file content
2. Replace the broken file in the map
3. Re-validate
4. If still broken after 1 retry, emit `event: error` with the validation details

This happens server-side before the `event: files` is emitted, so the frontend only ever receives valid code.

### 3. Frontend: Handle `event: files` and Multi-File State

**File:** `src/components/ai-builder/useStreamingCode.ts`

**A) New SSE case in `processSSELine()`** (after line 844):

```typescript
case 'files': {
  const projectFiles = data.projectFiles || data.files || {};
  if (Object.keys(projectFiles).length > 0) {
    setState(prev => ({ ...prev, files: projectFiles, code: '' }));
    // Extract App.tsx for backward compat
    const appCode = projectFiles['/App.tsx'] || projectFiles['App.tsx'] || '';
    if (appCode) {
      lastGoodCodeRef.current = appCode;
    }
    options.onComplete?.(appCode);
  }
  break;
}
case 'code_progress': {
  // Visual feedback during generation (no code applied)
  break;
}
```

**B) Skip legacy finalization when files exist** (around line 978):

After the streaming loop, check if `state.files` has been populated by the `files` event. If so, skip the entire `extractCodeFromRaw` / `validateTsx` / `safeApply` pipeline -- the code was already validated server-side and applied atomically.

```typescript
// After streaming loop ends:
if (Object.keys(stateRef.current.files).length > 0) {
  // Multi-file mode: code was applied atomically via 'files' event
  setState(prev => ({ ...prev, isStreaming: false }));
  return lastGoodCodeRef.current;
}
// ... existing single-file finalization below
```

**C) Wire `files` into persistence** -- When `onComplete` fires with multi-file data, the caller (`AIBuilderCanvas`) should save `files_snapshot` to the database alongside `code_snapshot`.

### 4. Fix False Denial (Layout Enforcer)

**File:** `src/components/ai-builder/useStreamingCode.ts` (lines 339-374)

The `enforceHeroFirstLayout()` function is too aggressive. It matches `<header>` which could be a semantic HTML element (not navigation), and it doesn't account for promo banners, alerts, or announcement bars above the hero.

**Fix:** Narrow the pattern to only match actual navigation components:

```typescript
// Only match actual navigation patterns, not generic HTML5 elements
const navPattern = /<(?:nav|Navigation|Navbar|NavBar|SiteNav|MainNav)[\s>\/]/;
// Remove <header> and <Header> from the pattern -- these are valid above hero
```

This stops promo banners, announcement bars, and `<header>` elements from being falsely rejected.

### 5. System Prompt: Multi-File Structure Rules

**File:** `supabase/functions/vibecoder-v2/index.ts` (CODE_EXECUTOR_PROMPT)

Add a new section to the system prompt enforcing modular file output:

```
FILE STRUCTURE PROTOCOL (MANDATORY FOR ALL BUILDS):
When building a NEW storefront (BUILD intent), split into files:
  /App.tsx - Router + layout compositor (imports sections/components)
  /components/NavBar.tsx - Navigation bar
  /components/Footer.tsx - Footer
  /sections/Hero.tsx - Hero section
  /sections/[Name].tsx - Each major section
  
When MODIFYING, only output the changed file(s).
Keep each file under 150 lines.

The === CODE === section must contain ONLY a JSON object:
{
  "files": {
    "/App.tsx": "<full file content>",
    "/components/NavBar.tsx": "<full file content>"
  }
}
```

### 6. Persist Multi-File Snapshots

**File:** `src/components/ai-builder/AIBuilderCanvas.tsx`

When `addMessage()` is called after a successful generation, pass the `files` map as `filesSnapshot` so it gets stored in `vibecoder_messages.files_snapshot`. On project reload, the `getLastFilesSnapshot()` function (already implemented in `useVibecoderProjects.ts`) will restore the full file map.

## Implementation Order

1. Edge function: Update system prompt for JSON files output format
2. Edge function: Replace `processContent()` CODE section with JSON parse + `event: files`
3. Edge function: Add auto-repair function
4. Edge function: Pass analyzer suggestions to main stream
5. Frontend: Add `files` case to `processSSELine()`
6. Frontend: Skip legacy finalization when files exist
7. Frontend: Fix `enforceHeroFirstLayout()` false positives
8. Frontend: Wire `files_snapshot` persistence in `AIBuilderCanvas`
9. Deploy edge function and test end-to-end

## Technical Notes

- The `parseMultiFileOutput()` function (lines 84-125 of useStreamingCode.ts) already exists but uses a different marker format (`/// BEGIN_FILES ///`). The new approach uses JSON directly, which is more robust and doesn't require custom parsing.
- The `ProjectFiles` type and `SandpackRenderer` multi-file support are already fully implemented in `VibecoderPreview.tsx` (lines 344-439). No changes needed there.
- The `files_snapshot` column already exists in `vibecoder_messages` and is handled by `useVibecoderProjects.ts`. No database changes needed.
- Credit cost is unchanged -- the auto-repair call uses `gemini-2.5-flash` which is free in the current pricing model.
- Legacy single-file output remains supported as a fallback: if JSON parse fails, the system falls back to the existing `code_chunk` behavior.
