
## What’s actually going wrong (root causes)

### 1) The builder is “shredding” code because the backend stream parser is dropping tokens
In `supabase/functions/vibecoder-orchestrator/index.ts`, `extractStreamedCode()` parses the AI’s SSE stream by doing `chunk.split('\n')` and `JSON.parse()` per line. When JSON is split across network chunks (very common), parsing fails and the code silently **skips those partial lines**, which means you literally lose pieces of the generated output.

That produces exactly the symptom you described: “stuttering”, abrupt cutoffs, broken objects like `price: 49.99,"`, and random incomplete JSX.

This is the single highest-impact fix: **make the backend SSE parsing line-buffered and tolerant of partial JSON**, like your frontend streaming parser already is.

### 2) “Script error” in the preview is often cross-origin noise, not a useful stack trace
Your `srcdoc` preview loads React/Babel/Tailwind from CDNs. Some runtime failures can surface as generic `"Script error."` because the browser won’t provide details unless the scripts are CORS-enabled. That prevents your auto-fix prompt from receiving the real stack trace.

### 3) The chat input still can “vanish” if the chat column layout doesn’t guarantee a bottom-pinned input
You already improved `SimpleChat` with `min-h-0` and `shrink-0`, which is the right direction. But if any ancestor container is missing `min-h-0` or if `ScrollArea`’s internal viewport styles fight flex layout, the message list can still expand and push the input out of view (especially when logs get long).

## Goals of the fix
1) Backend never drops stream tokens → code output is complete and syntactically valid far more often.
2) If code is invalid, it is blocked from being saved and shown as “applied”.
3) Auto-fix gets real, actionable errors (not “Script error.”).
4) The chat input is always visible and usable.

---

## Implementation plan (sequenced, minimal, and “bulletproof”)

### Phase A — Stop code shredding at the source (backend orchestrator)
**A1. Replace `extractStreamedCode()` in `vibecoder-orchestrator` with a robust SSE parser**
- Maintain a `textBuffer` string.
- Append decoded chunks to buffer.
- Process **line-by-line** using newline detection (not `split('\n')` per chunk).
- Ignore SSE comments `:` and empty lines.
- Only parse lines starting with `data: `.
- If `JSON.parse()` fails, re-buffer the line and wait for more data (do not discard).
- Handle `[DONE]`.
This matches the “correct streaming” approach you pasted in your notes and will prevent token loss.

**A2. Make parsing strict: if the AI response cannot be reconstructed cleanly, fail the build**
- If the stream ends and buffer still contains an incomplete JSON line that never becomes parseable, return a linter-style FAIL event with a clear message (“Stream parse incomplete; retrying”) and trigger the heal loop instead of saving broken output.

**A3. Add a “code integrity gate” before emitting `type: 'code'`**
You already have `validateCodeStructure()` in orchestrator. We’ll harden it slightly:
- Require either `export default function App()` OR `function App()` (but prefer export default).
- Require the file ends with `}` AND contains a `return (` inside the `App`.
- Add a hard block for common junk markers (`/// END_CODE ///` appearing inside the code payload, or stray unmatched triple-backticks).
If validation fails, do not send `code` event—send an `error` event and enter heal.

### Phase B — Make the “Fix This Now” loop actually repair (not claim success)
**B1. When preview errors happen, capture and pass structured debugging context**
- Extend `SimplePreview`’s `postMessage` payload to include:
  - `message`
  - `stack` (when available)
  - `source` (`onerror` vs `unhandledrejection` vs `runtime-trycatch`)
  - `line/col` (when available)
This makes the fix prompt far more concrete than a single string.

**B2. Improve preview error fidelity (reduce “Script error.”)**
Inside `SimplePreview.tsx`’s HTML:
- Add `crossorigin="anonymous"` to CDN `<script>` tags for React/ReactDOM/Babel (and optionally Tailwind).
- Add `window.addEventListener('error', ...)` and `window.addEventListener('unhandledrejection', ...)` in addition to assigning `window.onerror`, capturing `event.error?.stack` when possible.

**B3. Feed better “repair prompt” content into the backend**
In `SimpleVibecoderPage.tsx` `handleFixError()`:
- Include:
  - the captured stack trace
  - last known `code` (current App code)
  - a short instruction: “Return a COMPLETE, standalone App.tsx. No fragments.”
This aligns with your “CODE INTEGRITY PROTOCOL” idea, but enforced via the backend system prompt and validation gates—not just vibes.

### Phase C — Chat input can’t disappear (UI layout hardening)
**C1. Ensure every flex parent in the chat column uses `min-h-0`**
You already have:
- chat pane wrapper: `flex flex-col min-h-0`
- SimpleChat: `flex-1 min-h-0`
- ScrollArea: `flex-1 min-h-0`
We’ll verify and add `min-h-0` to any missing intermediate wrappers (especially the chat pane container in `SimpleVibecoderPage.tsx` and any Radix `ScrollArea` wrappers if needed).

**C2. Make the input bar “sticky” within the chat panel**
Even with correct flex, sticky gives extra safety:
- Wrap `ChatInputBar` container with `sticky bottom-0 z-10 bg-background`.
This prevents rare edge cases where scroll/height calculations hide the input behind overflow.

**C3. Add an “Emergency Input” fallback if UI still breaks**
If for any reason the main input isn’t visible:
- Render a minimal fixed input at bottom-right when `chatCollapsed === false` but the input is not in the viewport (simple `IntersectionObserver` on the input wrapper).
This is a last-resort safety net so you can always type.

### Phase D — Verify end-to-end and prevent regressions
**D1. Add a “known-bad stream simulation” test path**
- In orchestrator (server-side), add a small dev-only helper to validate the SSE parser against artificially chunked SSE lines (only executed in tests or behind a debug flag).

**D2. Manual acceptance checks**
1. Trigger a long generation (ensures chunk splitting happens).
2. Confirm generated code no longer arrives truncated.
3. Confirm “Fix This Now” uses real stack traces.
4. Confirm the chat input stays visible even with very long logs/messages.
5. Confirm saving to the database only happens when code passes the integrity gate.

---

## Files that will be changed (no refactors beyond scope)
- `supabase/functions/vibecoder-orchestrator/index.ts`
  - Replace `extractStreamedCode()` with a buffered SSE parser
  - Tighten delivery gates using `validateCodeStructure()`
- `src/components/ai-builder/SimplePreview.tsx`
  - Improve error capture payload (message + stack + metadata)
  - Improve CDN script CORS handling to reduce “Script error.”
- `src/components/ai-builder/SimpleVibecoderPage.tsx`
  - Strengthen `handleFixError()` prompt + pass richer error context
  - Hardening chat panel layout (`min-h-0`, optional sticky footer wrapper)
- (Optional, only if needed) `src/components/ui/scroll-area.tsx`
  - If Radix viewport styling is fighting flex constraints, adjust the viewport class strategy (only if inspection confirms it’s the culprit).

---

## Notes on your “CODE INTEGRITY PROTOCOL” suggestion
You’re correct in principle: we must enforce “complete file only” and bracket closure. The important improvement is **where** we enforce it:
- Put the rules into the backend Builder system prompt (so the model is guided)
- Put hard validation gates in the orchestrator (so broken output is never treated as success)
- Fix the streaming parser so we don’t lose tokens even when the model did everything right

That combination is what will make this feel “premium” and reliable.

