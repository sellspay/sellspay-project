

# Fix: Structured Error Reporting + Small Edit Bypass

## Problem

The system currently masks every failure behind one generic message: "Generation exceeded safe limits." The actual logs show the model IS generating code (27,870 chars) but gets rejected because `looksTruncated()` requires a sentinel marker (`// --- VIBECODER_COMPLETE ---`) that the model often doesn't emit, especially for simple FIX intents.

A "fix the click handler" request generates valid code, but the sentinel check kills it.

---

## Changes

### 1. Replace Generic Error with Structured Error Codes

**File: `supabase/functions/vibecoder-v2/index.ts`**

Replace the single "exceeded safe limits" message in the validation gate (line 1601) with specific error codes:

- `MISSING_EXPORT_DEFAULT` -- code lacks `export default`
- `BRACKET_IMBALANCE` -- unbalanced `{}()[]`
- `CODE_TOO_SHORT` -- under 300 chars
- `MISSING_SENTINEL` -- no completion marker (weakest signal)
- `MODEL_EMPTY_RESPONSE` -- model returned nothing
- `INTENT_VALIDATION_FAILURE` -- intent check said no
- `COMPLEXITY_GUARD` -- plan too complex
- `NO_OP` -- output matches input

Each error code gets a user-facing message that tells the user what actually happened.

### 2. Add Diagnostic Logging Before Every Failure

**File: `supabase/functions/vibecoder-v2/index.ts`**

Before every failure path, log:
```
FAILURE_REASON, PROMPT_LENGTH, CODE_CONTEXT_LENGTH, GENERATED_LENGTH, INTENT, MODEL_USED
```

This replaces debugging blind with structured observability.

### 3. Small Edit Bypass: Skip Sentinel Check for FIX Intent

**File: `supabase/functions/vibecoder-v2/index.ts`**

The key fix: `looksTruncated()` currently requires the sentinel for ALL intents. For FIX intent (simple fixes like click handlers, routes, navigation):

- Skip the sentinel check entirely
- Only check for `export default` and bracket balance
- These are the structural checks that actually matter

This means a FIX intent that produces valid, compilable code with `export default` and balanced brackets will pass -- even without the sentinel marker the model often forgets to include.

Refactor `looksTruncated()` to accept an `intent` parameter:

```
function looksTruncated(code: string, intent?: string): boolean
```

When `intent === "FIX"`:
- Check `export default` (required)
- Check bracket balance (required)
- Check minimum length (required)
- Skip sentinel check (not required for small edits)

### 4. Update Frontend Error Display

**File: `src/components/ai-builder/AIBuilderCanvas.tsx`**

Parse the structured error from the job's `error_message` field and show the specific error code + message instead of the generic "exceeded safe limits" string. For example:

- `MISSING_EXPORT_DEFAULT`: "Generated code was incomplete (missing component export). Please retry."
- `BRACKET_IMBALANCE`: "Generated code has syntax issues. Please retry with a simpler request."
- `MISSING_SENTINEL`: "Generation may have been cut short. Retrying might help."

### 5. Update Ghost Fixer Message

**File: `src/hooks/useGhostFixer.ts`**

Replace the generic "exceeded safe limits" string (line 360) with the specific error reason from the failed attempt.

---

## Technical Details

### Edge Function Changes (`supabase/functions/vibecoder-v2/index.ts`)

**`looksTruncated()` (lines 226-244):** Add `intent` parameter. When intent is `FIX`, skip sentinel check on line 241.

**Validation gate (lines 1598-1606):** Replace the single `looksTruncated()` call with a detailed check that returns the specific failure reason. Log diagnostic data before setting failure status.

**Add diagnostic logging (lines 1598-1606):** Before the gate, log:
```typescript
console.log(`[Job ${jobId}] VALIDATION_INPUT:`, {
  intent: intentResult.intent,
  promptLength: prompt.length,
  codeContextLength: currentCode?.length ?? 0,
  generatedLength: codeResult?.length ?? 0,
  hasExportDefault: /export\s+default\s/.test(codeResult),
  hasSentinel: codeResult.includes(VIBECODER_COMPLETE_SENTINEL),
  bracketBalance: (codeResult.match(/[({[]/g) ?? []).length - (codeResult.match(/[)\]}]/g) ?? []).length,
});
```

**Pass intent to looksTruncated (line 1600):** Change from `looksTruncated(codeResult)` to `looksTruncated(codeResult, intentResult.intent)`.

### Frontend Changes (`src/components/ai-builder/AIBuilderCanvas.tsx`)

**Lines 486-494 and 558-563:** Parse `job.error_message` JSON for `type` field and display the corresponding user-friendly message instead of the hardcoded generic string.

### Ghost Fixer Changes (`src/hooks/useGhostFixer.ts`)

**Line 360:** Replace hardcoded string with dynamic reason from the validation failure.

---

## What This Fixes

- A simple "fix click handler" request that generates 27,870 chars of valid code will no longer be rejected just because it's missing a sentinel marker
- Users see exactly why something failed instead of a generic message
- Logs show the actual failure branch, prompt size, and code size for every failure
- FIX intent gets a fast path that skips unnecessary gates
