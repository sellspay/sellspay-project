

# AI Builder Page -- Full Error Diagnostic and Fix Plan

## Diagnostic Summary

After a thorough investigation (browser testing, network analysis, edge function testing, database queries, and source code review), I found that the AI builder page is **mostly functional** -- all API calls return 200, the edge function generates valid code, and the streaming pipeline works end-to-end. However, there are several underlying issues causing instability and data corruption.

---

## Issues Found (Ranked by Severity)

### Issue 1: CRITICAL -- Massive Message Duplication in Database

**What's wrong:** The same user message ("in the about section add instagram and youtube logo...") is stored **16 times** in the database. Assistant messages are also duplicated 3-6x each. This corrupts the message history, wastes database space, and causes the chat UI to show repeated entries.

**Root cause:** The `addMessage` function in `useVibecoderProjects.ts` has a UI-level deduplication guard (`dedupeConsecutiveMessages`), but nothing prevents duplicate writes to the database. When the user clicks send or the component re-renders, the same message gets inserted multiple times.

**Fix:**
- Add a database-level deduplication guard using a debounce ref that tracks the last inserted message hash
- Add a `UNIQUE` constraint or a `before INSERT` trigger on `vibecoder_messages` that checks for consecutive identical messages within a short time window
- Clean up existing duplicate rows with a SQL migration

### Issue 2: HIGH -- `check-subscription` CORS Headers Incomplete

**What's wrong:** The `check-subscription` edge function uses a minimal CORS header set:
```
"authorization, x-client-info, apikey, content-type"
```
Missing the required Supabase client headers (`x-supabase-client-platform`, etc.). This can cause sporadic CORS preflight failures in certain browser configurations.

**Fix:** Update `check-subscription/index.ts` to use the full CORS header set matching `vibecoder-v2`.

### Issue 3: MEDIUM -- `last_success_at` Never Updated

**What's wrong:** The `vibecoder_projects.last_success_at` column is always NULL. After a successful code generation, nothing updates this field. This means the system can't tell which projects have had at least one successful build.

**Fix:** After a successful generation (in the `onComplete` callback in `AIBuilderCanvas`), update the `last_success_at` timestamp on the project record.

### Issue 4: MEDIUM -- Background Job Creates Duplicate Messages

**What's wrong:** The code has TWO paths that can add assistant messages after a generation:
1. The streaming `onComplete` callback appends an assistant message with code
2. The background job completion handler (realtime subscription) ALSO appends a message

There's a guard (`activeJobIdRef`) that's supposed to prevent this, but when streaming completes AFTER the realtime event fires, or vice versa, duplicates slip through.

**Fix:** Make the message-append logic idempotent by checking if an assistant message with the same code snapshot already exists for this project before inserting.

### Issue 5: LOW -- Redundant API Calls on Page Load

**What's wrong:** The page makes duplicate calls on load:
- `profiles` is fetched 4+ times with the same query
- `has_role` RPC is called 8+ times
- `auth/v1/user` is called 5+ times

This is noisy but not breaking. It's caused by multiple components each independently fetching the same data.

**Fix:** (Future optimization) Consolidate profile/role fetching into a shared context provider.

---

## Implementation Steps

### Step 1: Fix Message Duplication (Database + Frontend)

**Database migration:**
- Create a SQL function `prevent_duplicate_vibecoder_message()` that checks if the same `project_id + role + content` was inserted within the last 5 seconds
- Add a `BEFORE INSERT` trigger on `vibecoder_messages` using this function
- Run a cleanup query to remove existing duplicate rows (keep oldest of each group)

**Frontend (`useVibecoderProjects.ts`):**
- Add a `lastInsertRef` that stores `{hash, timestamp}` of the last DB insert
- Before calling `supabase.from('vibecoder_messages').insert(...)`, check if the same content was just inserted within 3 seconds
- Skip the insert if it's a duplicate

### Step 2: Fix CORS on `check-subscription`

Update the CORS headers in `supabase/functions/check-subscription/index.ts` to match the full standard:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

### Step 3: Update `last_success_at` on Successful Generation

In `AIBuilderCanvas.tsx`, inside the `onComplete` callback (around line 284), add:
```typescript
await supabase
  .from('vibecoder_projects')
  .update({ last_success_at: new Date().toISOString() })
  .eq('id', generationLockRef.current || activeProjectId);
```

### Step 4: Clean Up Duplicate Database Records

Run a cleanup migration to remove duplicate messages while keeping the oldest of each group:
```sql
DELETE FROM vibecoder_messages
WHERE id NOT IN (
  SELECT MIN(id) FROM vibecoder_messages
  GROUP BY project_id, role, content, code_snapshot IS NOT NULL
);
```

### Step 5: Redeploy `check-subscription`

Deploy the updated edge function with corrected CORS headers.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ai-builder/hooks/useVibecoderProjects.ts` | Add insert debounce guard to `addMessage` |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add `last_success_at` update in onComplete |
| `supabase/functions/check-subscription/index.ts` | Fix CORS headers |
| Database migration | Add dedup trigger + cleanup query |

## What This Does NOT Change

- The edge function pipeline (vibecoder-v2) -- already working correctly after the Gemini migration
- The streaming code parser (useStreamingCode) -- functioning properly
- The agent loop -- working as designed
- The preview rendering (Sandpack) -- no issues detected

