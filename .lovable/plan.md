

# Pipeline Rebuild: Deterministic Execution with Validation Gates

This is a full rebuild of the AI generation pipeline from "hope it works" to "provably correct." The plan implements the blueprint in 4 phases, each deployable independently.

---

## Phase 1: Stop Lying / Stop Hanging (Backend + Frontend)

### 1A. Edge Function: Structured SSE with Terminal Events + Heartbeats

**File: `supabase/functions/vibecoder-v2/index.ts`**

Rewrite the streaming section (lines 1697-1854) to:

- Emit structured events: `phase`, `plan`, `code_begin`, `code_chunk`, `code_end`, `validation`, `complete`, `error`, `heartbeat`
- Add `AbortController` with hard timeouts: 20s for plan calls, 60s for build calls
- Every stream MUST end with exactly one terminal event (`complete`, `error`, or `needs_user_action`)
- Send heartbeats every 10s during model response wait
- Add `code_hash` (simple MD5/length hash) to `code_end` event for injection verification
- If stream closes without terminal event, frontend treats as failure

### 1B. Edge Function: Truncation Detection (No Patching)

Add `looksTruncated()` function that checks:
- Missing `export default`
- Bracket imbalance
- Code under 300 chars
- Missing sentinel

If truncated:
- Do NOT save partial code to project
- Do NOT set `needs_continuation`
- Set job status to `failed` with message: "Generation exceeded safe limits. Please simplify your request."

### 1C. Frontend: Replace Fake Progress Bar with Phase Pill

**File: `src/components/ai-builder/StreamingPhaseCard.tsx`**

Replace the indeterminate progress bar (lines 143-150) with a simple phase pill + spinner dot. Remove the animated width trick `animate={{ width: ['20%', '80%', '40%', '90%', '60%'] }}` which is a visual lie.

### 1D. Frontend: Honest Healer Messaging

**File: `src/components/ai-builder/AIBuilderCanvas.tsx`**

- When healer runs, show: "Generation was interrupted; retrying..."
- Never show "Recovered successfully" unless intent check passes
- If stream closes without terminal event, show error + Retry button

### 1E. Frontend: Handle Missing Terminal Events

**File: `src/components/ai-builder/useStreamingCode.ts`**

After reader loop ends, check if any terminal event (`complete`/`error`) was received. If not, fire `onError` with "Stream ended unexpectedly. Please retry."

---

## Phase 2: Stop "Compiles But Didn't Do Request" (Intent Validation)

### 2A. Edge Function: Intent Validator Prompt

Add a new function `validateIntent()` in the edge function that calls Gemini with a cheap, low-token prompt:

```
You are a strict code reviewer.
User request: "{USER_PROMPT}"
Generated code: {GENERATED_CODE}
Answer ONLY valid JSON:
{
  "implements_request": boolean,
  "missing_requirements": string[]
}
```

### 2B. Edge Function: No-Op Detector

Add `isNoOp()` function that normalizes whitespace and compares previous vs generated code. If delta is less than 1%, flag as no-op.

### 2C. Edge Function: Gate Completion on Intent

In the job processing path (lines 1564-1638):
1. After code extraction, run `looksTruncated()`
2. If not truncated, run `validateIntent()` 
3. If `implements_request === false` AND `build_attempts < 2`, retry builder with missing requirements appended
4. If still fails, set `needs_user_action` with guidance
5. Only set `completed` when all gates pass

### 2D. Add Attempt Counters to Job Table

Database migration to add columns to `ai_generation_jobs`:
- `build_attempts` (integer, default 0)
- `intent_check_attempts` (integer, default 0)
- `validation_report` (jsonb, nullable)
- `terminal_reason` (text, nullable)

---

## Phase 3: Kill Truncation at the Source

### 3A. Edge Function: Complexity Guard

If planner detects more than 6 phases or complexity is "high":
- Do not execute in one shot
- Return `needs_user_action` with suggestion to split into 2-3 smaller requests
- Provide specific split suggestions based on the plan phases

### 3B. Ghost Fixer: Intent-Oriented Healer

**File: `src/hooks/useGhostFixer.ts`**

Replace the continuation prompt (lines 196-223) with an intent-oriented healer that produces a COMPLETE file, not a syntax patch:

```
The previous generation was truncated.
User request: "{USER_PROMPT}"
Previous code (before change): {PREVIOUS_CODE}
Produce a COMPLETE working single-file React component.
Fully implement the request.
Return ONLY the final code.
```

### 3C. Ghost Fixer: Hard Cap at 1 Retry

Already done (maxRetries = 1), but ensure the AIBuilderCanvas also passes `maxRetries: 1` (currently passing 3 on line 205).

---

## Phase 4: Premium UX (Plan Card + Observability)

### 4A. Plan Card with Manual Approval

Update the plan response flow so that when the planner returns a plan:
- Show a card with title, overview, phases with risk badges, and affected areas
- Buttons: "Approve and Execute", "Edit Plan", "Cancel"
- No code generation until user clicks Approve
- Store approved plan in the job record

### 4B. Execution Checklist

During execution, show a real-time checklist:
- "Generating code" (spinner while building)
- "Validating changes" (spinner during intent check)
- "Preview updated" (check when Sandpack confirms)

### 4C. Observability Logging

Add structured logging to each job:
- `generated_code_length`
- `truncation_detected` (boolean)
- `no_op_detected` (boolean)  
- `intent_ok` (boolean)
- `attempt_counts` (json)
- `time_per_phase_ms` (json)
- `terminal_reason` (text)

This data goes into the existing `validation_report` jsonb column.

---

## Technical Summary

| File | Changes |
|------|---------|
| `supabase/functions/vibecoder-v2/index.ts` | Structured SSE, heartbeats, AbortController timeouts, truncation blocker, intent validator, no-op detector, complexity guard |
| `src/hooks/useGhostFixer.ts` | Intent-oriented healer prompt, hard 1-retry cap |
| `src/hooks/useAgentLoop.ts` | New phase states (validating, repairing, needs_user_action) |
| `src/hooks/useBackgroundGeneration.ts` | Handle new job statuses, terminal event detection |
| `src/components/ai-builder/useStreamingCode.ts` | Structured SSE parser for new events, missing-terminal detection |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Fix maxRetries=3 to 1, honest messaging, plan approval flow |
| `src/components/ai-builder/StreamingPhaseCard.tsx` | Replace fake bar with phase pill, add checklist |
| Database migration | Add attempt counters + validation columns to ai_generation_jobs |

