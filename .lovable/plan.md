
# Fix: JSON Response Being Rendered as Code

## Problem Analysis

The VibeCoder AI builder has a critical bug where the **preview crashes** with a `TypeError: Cannot assign to read only property 'message'` error. This happens because:

1. When you send a request, the frontend passes a `jobId` to the backend for background-persistent generation
2. The backend (`vibecoder-v2`) detects the `jobId` and switches to **non-streaming mode**
3. Instead of streaming the AI's code, it returns a JSON status: `{"success":true,"jobId":"...","status":"completed"}`
4. The frontend streaming code (`useStreamingCode.ts`) doesn't recognize this JSON response
5. It treats the JSON as if it were React/TSX code and sets it as the preview code
6. Sandpack tries to render `{"success":...}` as a React component, which fails with a syntax error
7. The error object is frozen by Sandpack, and when React's error overlay tries to modify it, it crashes with the "read-only property" error

## Technical Solution

### 1. Detect JSON Response in `useStreamingCode.ts`

Before processing the response body as streaming text, check if the response is JSON (Content-Type header) and if it contains a job status response. If so, **skip the streaming parser** and let the background generation handler deal with it.

```text
┌─────────────────────────────────────────────────────────────┐
│  Frontend: useStreamingCode.ts                              │
│                                                             │
│  fetch('/vibecoder-v2', { jobId: '...' })                   │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────┐                        │
│  │ Check Content-Type header       │                        │
│  │ OR first bytes of response      │                        │
│  └─────────────────────────────────┘                        │
│           │                                                 │
│     ┌─────┴─────┐                                           │
│     │           │                                           │
│     ▼           ▼                                           │
│  [JSON]      [Stream]                                       │
│     │           │                                           │
│     ▼           ▼                                           │
│  Return early   Continue with                               │
│  (job will be   streaming parser                            │
│  handled by                                                 │
│  realtime sub)                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Add Content-Type Check

The backend returns `Content-Type: application/json` for job responses and `Content-Type: text/event-stream` for streaming. The frontend should check this header and handle accordingly.

### 3. Add JSON Prefix Detection (Fallback)

As a safety net, if the first characters of the response body are `{` (indicating JSON), treat it as a job status response and skip the code parser.

## Files to Modify

1. **`src/components/ai-builder/useStreamingCode.ts`**
   - After checking `response.ok`, read the `Content-Type` header
   - If `application/json`, parse as job status and return early (the realtime subscription will handle the completed job)
   - Add a fallback check for responses starting with `{`

2. **Optional safety: `supabase/functions/vibecoder-v2/index.ts`**
   - Could add a more explicit marker in the JSON response so the frontend can definitely identify it

## Expected Behavior After Fix

1. User sends a request → `jobId` is created and passed to backend
2. Backend processes in non-streaming mode, returns JSON status
3. **Frontend detects JSON response** and returns early without modifying code state
4. Realtime subscription picks up the completed job and applies `code_result` from the database
5. Preview updates cleanly with no syntax errors

## Why This Fixes the Read-Only Property Error

The error happens because:
- Invalid JSON is set as code → Sandpack crashes → Error object is frozen
- Error overlay tries to modify frozen object → TypeError

By preventing JSON from ever being set as code, we eliminate the root cause entirely.
