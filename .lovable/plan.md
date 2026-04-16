
Looking at the 7 issues from my last message, I'll prioritize the ones that actually break the user experience (false failures, missing recovery, no visibility) and defer the cosmetic stuff (file size).

The core insight: **the worker is doing the right thing, but the client and DB layer don't know what's happening between status changes.** Adding a heartbeat + failure stage breadcrumb fixes most of the perceived breakage.

# Plan: Fix AI Builder Generation Reliability

## What I'm Fixing

### 1. Heartbeat-based stale detection (kills false timeouts)
**Problem:** The 200s wall-clock timer force-fails jobs that are still actively generating. Tabbing out → coming back → "failed" even though the worker is fine.

**Fix:**
- Add `last_heartbeat_at timestamptz` column to `ai_generation_jobs`
- Worker updates it every ~10s during generation (cheap UPDATE)
- Client stale-check now compares `now() - last_heartbeat_at > 45s` instead of total elapsed time
- Result: a 3-minute generation never false-fails as long as the worker is alive

### 2. Treat `needs_continuation` as failure, not success
**Problem:** Truncated output gets committed and shown as "✅ Changes applied" — user sees broken/partial code.

**Fix:** In `useBackgroundGeneration.ts`, route `needs_continuation` through `onJobError` with a clear message: "Generation was cut off — try a smaller request or click retry."

### 3. Add `failure_stage` breadcrumb
**Problem:** When something fails, `error_message` is one flat string. No idea WHERE it broke.

**Fix:**
- Add `failure_stage text` column: `intent | routing | generation | validation | repair | commit`
- Worker sets it at each stage boundary in `vibecoder-v2/index.ts`
- UI surfaces it in the error toast: "Failed during validation: invalid JSX in Hero.tsx"

### 4. Surface what changed on success
**Problem:** "Build succeeded" but the user sees zero visible change and no summary.

**Fix:**
- Worker already saves `summary` — but for MODIFY/FIX intents the summary is generic ("Modification applied"). Have the model return a short bullet list of what it actually changed (e.g., "Increased hero padding, swapped to serif headings, added gold accent border").
- Display this list in the chat message, not just a toast.
- If `files_changed_count === 0`, show a warning: "Build completed but no files were modified — your request may have been understood as no-op."

### 5. Resume vs. fail on edge function crash
**Problem:** Function crashes (OOM, gateway 502) → job stuck in `running` forever.

**Fix:**
- Use the existing `build_attempts` column. On stale heartbeat (>90s no update), client invokes a new `vibecoder-resume` edge function that checks `build_attempts < 2`, increments it, and re-runs from the last completed stage.
- After 2 failed attempts → mark `failed` with stage breadcrumb.

### 6. Guest gate on createJob
**Problem:** `AIBuilder.tsx` allows guests, but `createJob` silently fails because there's no `user.id`.

**Fix:** In `createJob`, if no user, redirect to `/login?redirect=/ai-builder` instead of toast-failing.

## Out of Scope (intentionally)
- Refactoring the 342-line hook into smaller files (cosmetic, not breakage)
- Streaming progress to UI (nice-to-have, not blocking)
- Removing the pre-classification Flash call (cost optimization, not reliability)

## Files Changed

**Database (migration):**
- Add `last_heartbeat_at`, `failure_stage`, `files_changed_count` columns to `ai_generation_jobs`

**Edge function:**
- `supabase/functions/vibecoder-v2/index.ts`: heartbeat updates every 10s, set `failure_stage` at each stage, return concrete change-summary bullets, set `files_changed_count`
- `supabase/functions/vibecoder-resume/index.ts` (new): retry handler

**Client:**
- `src/hooks/useBackgroundGeneration.ts`: heartbeat-based stale check, `needs_continuation` → error, invoke resume on heartbeat-stale, surface `failure_stage` in errors
- `src/pages/AIBuilder.tsx`: redirect guests on generate (or wherever generate is wired)
- Whatever component renders job results: show change-summary bullets + zero-change warning

## Why This Order

Heartbeat (#1) alone fixes ~70% of the "it failed when I came back" complaints. Combined with `needs_continuation` (#2) and resume (#5), the system stops lying to users. The breadcrumb (#3) and change summary (#4) make the remaining real failures debuggable instead of mystery.

Estimated impact: most "didn't work" reports should disappear, and the ones left will tell you exactly what stage broke.
