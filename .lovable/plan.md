

# Visible Cognitive Streaming: Wire the Backend to the Frontend

## Root Cause

The structured SSE streaming code in the edge function (lines 1750-1934) is **dead code**. It only executes when no `jobId` is provided. But the frontend **always** creates a job via `createJob()`, so every request takes the job-based path (lines 1447-1741) which:

1. Collects the entire AI response silently into `fullContent`
2. Writes it to the database when done
3. Returns a JSON response

The user sees nothing during generation because the structured SSE events (`phase`, `text`, `plan`, `code_chunk`, `summary`) **never fire**.

The `StreamingPhaseCard` component exists and renders beautifully -- it just never receives data.

## Solution

Merge the two paths: when a `jobId` is present, **stream structured SSE events to the client AND write results to the database at the end**. This gives users live cognitive transparency while preserving persistence.

## Changes

### 1. Edge Function: Unified Streaming + Job Path

**File: `supabase/functions/vibecoder-v2/index.ts`**

Replace the current split architecture (job path at line 1447 vs streaming path at line 1744) with a single unified path that:

- Always returns an SSE stream to the client (never a JSON response)
- Parses structured sections (`=== ANALYSIS ===`, `=== PLAN ===`, `=== CODE ===`, `=== SUMMARY ===`) in real-time
- Emits phase events, analysis text, plan items, code chunks, and summary as they arrive
- When a `jobId` is present, also writes the final results to the database after the stream completes
- Keeps the heartbeat and timeout logic

The key structural change:

```text
BEFORE:
  if (jobId) {
    // Collect silently, write to DB, return JSON
  } else {
    // Stream SSE events
  }

AFTER:
  // Always stream SSE events
  // If jobId exists, also write to DB when stream ends
```

The stream processing logic (parsing `=== ANALYSIS ===` markers, emitting events) stays the same as the existing streaming path. The DB write logic (validation gates, code extraction, job status update) from the job path gets moved into the stream's `finally` block.

### 2. Frontend: Handle SSE Even for Job-Backed Runs

**File: `src/components/ai-builder/useStreamingCode.ts`**

Currently, when the response is JSON (job-backed), the hook bails out early (line 462-469):

```typescript
if (isJsonResponse) {
  setState(prev => ({ ...prev, isStreaming: false }));
  options.onPhaseChange?.('building');
  return lastGoodCodeRef.current;
}
```

Since the edge function will now always return SSE (even for job-backed runs), this JSON bailout path becomes the fallback rather than the norm. The existing SSE parser at lines 604-657 already handles all the structured events correctly -- it just never ran because the response was always JSON.

No changes needed here -- the existing code already handles SSE correctly. The only change is the edge function response format.

### 3. Frontend: Allow Phase Data During Job-Backed Runs

**File: `src/components/ai-builder/AIBuilderCanvas.tsx`**

The `onStreamingComplete` callback currently skips message appending for job-backed runs (line 302-306). This is correct and stays the same -- the job completion handler adds the final message. But the phase events (analysis, plan, building, complete) should flow through regardless of whether the run is job-backed.

This already works because `phaseCallbacksRef` is wired independently of the job system. No changes needed.

### 4. Edge Function: Incremental Code Streaming

Instead of emitting the entire code section on every chunk (current behavior at line 1850), emit only the new delta. This makes the code tab update incrementally rather than re-sending the full code on every token.

Track the last emitted code position and only send new content:

```text
let lastCodeEmitLength = 0;

// In the code_chunk emission:
const newContent = codeSection.substring(lastCodeEmitLength);
if (newContent.length > 0) {
  emitEvent('code_chunk', { content: newContent, total: codeSection.length });
  lastCodeEmitLength = codeSection.length;
}
```

### 5. Edge Function: Job DB Write in Stream Cleanup

Move the job finalization logic (validation gates, code extraction, DB writes from lines 1517-1694) into the stream's `finally` block. This runs after all SSE events have been sent, ensuring:

- The user sees live phases during generation
- The job record gets the final results for persistence
- If the user leaves mid-stream, the job still gets written to DB

---

## What Users Will See

```text
User sends "Fix the click handler on Products"

  [Analysis phase - live streaming]
  "Checking the Products section click handler..."

  [Plan phase - checklist appears]
  - Locate Products click handler
  - Add navigation to /products route
  - Verify click binding

  [Building phase - code streams live]
  (code appears incrementally in the Code tab)

  [Complete phase - success badge]
  "Products click handler now routes correctly to /products."
```

Instead of the current experience:

```text
User sends "Fix the click handler on Products"

  "Generating code..."
  (silence for 10-30 seconds)
  (result appears or error)
```

## Technical Summary

| Aspect | Before | After |
|--------|--------|-------|
| Job-backed requests | JSON response, no SSE | SSE stream + DB write on completion |
| Phase events | Dead code (never fires) | Live streaming to `StreamingPhaseCard` |
| Code visibility | Nothing until complete | Incremental code chunks |
| DB persistence | Same | Same (writes in `finally` block) |
| Fallback | Still works if job creation fails | Same |

## Files Modified

1. `supabase/functions/vibecoder-v2/index.ts` -- Merge job + streaming paths into unified SSE stream
2. No frontend changes needed -- the existing SSE parser and `StreamingPhaseCard` already handle everything correctly

