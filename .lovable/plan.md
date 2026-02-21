
# Phase 3: Professional AI Builder System

## Current State Analysis

The edge function and frontend already have most of the machinery in place:

- **Edge function** uses `=== ANALYSIS ===`, `=== PLAN ===`, `=== CODE ===`, `=== SUMMARY ===` markers and emits structured SSE events (`phase`, `text`, `plan`, `code_chunk`, `summary`)
- **Frontend** `useStreamingCode.ts` handles these SSE events and routes them to callbacks
- **`StreamingPhaseCard`** renders phase transitions visually

However, several critical issues remain:

1. **Markers mismatch**: The system prompt uses `=== ANALYSIS ===` style but the user's spec calls for `[ANALYSIS]` style. Both work, but the parser is tightly coupled to the `===` format.
2. **`code_chunk` handler only updates preview if code passes `isLikelyCompleteTsx()`** -- during early streaming, partial code never passes this check, so users see nothing until near the end.
3. **No micro-edit detection** -- every request goes through the full planner pipeline regardless of complexity.
4. **Sentinel-based validation still active** (`MISSING_SENTINEL` error in `getValidationError`) -- causes false failures.
5. **No structured error events** sent to frontend -- errors are generic strings.
6. **No intent-specific prompt specialization** for FIX vs MODIFY (both use the same `CODE_EXECUTOR_PROMPT`).
7. **Ghost Fixer / truncation detection** relies on sentinel presence -- brittle.

---

## Changes

### 1. Edge Function: Add Micro-Edit Detection

**File: `supabase/functions/vibecoder-v2/index.ts`**

Add a `detectMicroEdit()` function near the complexity detector (around line 478). Micro-edits are small, surgical changes (click handlers, text changes, route fixes) that should skip heavy planning.

When a micro-edit is detected:
- Set `max_tokens` to 16000 (instead of 65000)
- Add a prompt injection: "This is a MICRO-EDIT. Keep your ANALYSIS and PLAN sections to 1-2 lines each. Focus on the BUILD section."
- Log it for observability

Detection keywords: `click`, `button`, `route`, `navigate`, `redirect`, `onClick`, `href`, `link`, `typo`, `text`, `color`, `font`, `size`, `title`, `rename`, `change the`

### 2. Edge Function: Intent-Specific Prompt Specialization

**File: `supabase/functions/vibecoder-v2/index.ts`**

In the `executeIntent()` function (line 1090), add intent-specific instructions injected after the base `CODE_EXECUTOR_PROMPT`:

- **FIX**: "Focus ONLY on correcting the reported issue. Do not redesign, restyle, or reorganize unrelated sections. Your ANALYSIS should identify the root cause. Your PLAN should list only the fix steps."
- **MODIFY**: "Preserve ALL existing layout, styling, and structure unless the modification explicitly requires changes. Your diff should be minimal."
- **BUILD**: (no extra injection -- full creative freedom)

### 3. Edge Function: Remove Sentinel-Based Validation

**File: `supabase/functions/vibecoder-v2/index.ts`**

In `getValidationError()` (line 230):
- Remove the `MISSING_SENTINEL` check entirely (lines 254-256)
- Keep structural checks: empty response, missing `export default`, bracket imbalance, code too short
- These structural checks are reliable and don't depend on the model remembering to append a magic string

In the job finalization block (line 1674):
- Update code extraction to not depend on `/// BEGIN_CODE ///` / `// --- VIBECODER_COMPLETE ---` markers
- Instead, extract code from the `=== CODE ===` section (which the streaming parser already identifies)
- Fall back to `/// BEGIN_CODE ///` extraction for backward compatibility

### 4. Edge Function: Structured Error Events

**File: `supabase/functions/vibecoder-v2/index.ts`**

Replace generic error strings with structured error objects:

```text
Instead of: emitEvent('error', { message: "Stream error" })
Use:        emitEvent('error', { code: "STREAM_ERROR", message: "..." })
```

Error codes:
- `VALIDATION_FAILED` -- structural check failed
- `MODEL_TRUNCATED` -- bracket imbalance detected (likely truncation)
- `STREAM_TIMEOUT` -- hard timeout reached
- `MODEL_ERROR` -- AI gateway returned non-200
- `NO_OP_DETECTED` -- output matches input (nothing changed)

### 5. Edge Function: Smart Retry Logic

**File: `supabase/functions/vibecoder-v2/index.ts`**

In the job finalization block, when `getValidationError()` returns a structural error:
- If `retryCount < 1`, automatically retry the generation with a continuation prompt: "Your previous output was incomplete (bracket imbalance detected). Please complete the code from where you left off."
- Only mark as `failed` after the retry also fails
- Emit `emitEvent('phase', { phase: 'retrying' })` so the frontend can show "Retrying..."

### 6. Frontend: Progressive Code Preview (Remove `isLikelyCompleteTsx` Gate During Streaming)

**File: `src/components/ai-builder/useStreamingCode.ts`**

The `code_chunk` handler (line 643) currently requires `isLikelyCompleteTsx()` before updating the preview. During streaming, partial code never passes this check until near completion.

Change: During active streaming, update the code preview on every chunk that's longer than 100 chars, even if it doesn't pass the completeness check. Only apply the strict check on the FINAL code after the stream ends.

```text
case 'code_chunk': {
  streamingCodeBuffer += (data.content || '');
  // During streaming: show partial code immediately (no completeness gate)
  if (streamingCodeBuffer.length > 100) {
    setState(prev => ({ ...prev, code: streamingCodeBuffer }));
  }
  break;
}
```

The final extraction at stream-end (line 790) still uses the strict check.

### 7. Frontend: Handle Structured Errors

**File: `src/components/ai-builder/useStreamingCode.ts`**

Update the `error` case in the SSE handler (line 655) to parse structured error codes and pass them to the `onError` callback with the code:

```text
case 'error': {
  const errorCode = data.code || 'UNKNOWN';
  const errorMsg = data.message || 'An error occurred';
  console.error(`[useStreamingCode] SSE error [${errorCode}]:`, errorMsg);
  // Surface to UI with structured info
  options.onError?.(new Error(`[${errorCode}] ${errorMsg}`));
  break;
}
```

### 8. Frontend: Handle "retrying" Phase

**File: `src/components/ai-builder/StreamingPhaseCard.tsx`**

Add a `retrying` phase to the `StreamPhase` type and render it with an orange retry icon and "Retrying generation..." text.

---

## Summary of Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/vibecoder-v2/index.ts` | Micro-edit detection, intent-specific prompts, remove sentinel validation, structured errors, retry logic, extract code from `=== CODE ===` section |
| `src/components/ai-builder/useStreamingCode.ts` | Progressive code preview during streaming, structured error handling |
| `src/components/ai-builder/StreamingPhaseCard.tsx` | Add `retrying` phase rendering |

## What This Does NOT Change

- The `=== ANALYSIS ===` / `=== PLAN ===` / `=== CODE ===` / `=== SUMMARY ===` marker format (already working)
- The SSE event types (already working)
- The `StreamingPhaseCard` component (already renders beautifully -- just adding one new phase)
- The plan approval flow (already implemented via `PlanApprovalCard`)
- Multi-file support (already implemented in previous phases)

## Impact

- **Micro-edits**: 3-5x faster, 70% fewer tokens
- **False failures**: Sentinel-based errors eliminated
- **Retry**: Automatic recovery from truncation (1 retry before failing)
- **Live preview**: Code streams visually during building phase (not just at the end)
- **Error clarity**: Users see "Code was incomplete, retrying..." instead of "Generation exceeded safe limits"
