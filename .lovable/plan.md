
# Pipeline Hardening: Deterministic Execution Flow

You're right -- the recovery system is band-aids on a broken pipeline. Here's the real fix.

---

## What's Actually Wrong

1. **max_tokens is only 8000** -- that's roughly 200 lines of React. Any multi-section page blows past this and gets truncated silently.
2. **Ghost Fixer chains up to 3 silent retries** using `gemini-2.5-flash-lite` (the weakest model), producing garbage patches that get stitched onto broken code.
3. **No intent verification** -- the system never checks if the output actually fulfills the user's request. It just checks for a sentinel marker.
4. **`needs_continuation` triggers more AI calls** that loop endlessly without telling you what's happening.

---

## The Fix (4 Changes)

### 1. Increase Token Limits (Edge Function)
- Bump `max_tokens` from `8000` to `65000` for BUILD/MODIFY intents
- Upgrade the model from `gemini-2.5-flash-lite` to `gemini-2.5-flash` for FIX/continuation intents (the lite model simply can't handle full pages)

### 2. Kill Multi-Patch Healing (Ghost Fixer)
- Reduce `maxRetries` from 3 to **1** (one shot only)
- If the single retry still fails: **hard fail** with a clear message asking you to simplify your request
- No more silent chained fixes

### 3. Add Truncation Detection That Blocks (Not Patches)
- In the edge function: if code is missing `export default` AND missing the sentinel, mark the job as `failed` (not `needs_continuation`)
- Return a clear error: "Generation exceeded safe limits. Please simplify your request or break it into parts."
- Stop saving broken partial code to the project

### 4. Disable Auto-Recovery Loop
- When a job comes back as `needs_continuation`, instead of silently triggering GhostFixer, show a toast: "Code was too complex for one generation. Please re-send with a simpler request."
- The user stays in control -- no silent background patching

---

## Technical Details

### Edge Function (`supabase/functions/vibecoder-v2/index.ts`)
- Line 1211: Change `maxTokens` from `8000` to `65000` for code intents
- Line 364-366: Change `vibecoder-flash` model from `gemini-2.5-flash-lite` to `gemini-2.5-flash`
- Lines 1570-1576: Add `export default` check -- if missing AND no sentinel, set `jobStatus = "failed"` with clear error message instead of `needs_continuation`

### Ghost Fixer (`src/hooks/useGhostFixer.ts`)
- Line 42: Change `maxRetries` default from `3` to `1`
- Lines 365-374: After single retry fails, call `onFixFailure` with user-facing message instead of returning partial code

### Background Generation (`src/hooks/useBackgroundGeneration.ts`)
- Lines 187-189: When `needs_continuation` status arrives, treat it as a failure with guidance message instead of routing to GhostFixer

### Canvas Handler (`src/components/ai-builder/AIBuilderCanvas.tsx`)
- Update `onJobComplete` to show a clear failure toast when truncation is detected, instead of silently triggering recovery
