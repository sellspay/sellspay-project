
# Fix Plan: AI Builder Preview Errors, Build Toast Spam, and Missing Live Logs

## Summary
This plan addresses three critical bugs in the AI Builder:
1. **Preview "spazzing"** - Sandpack rapidly flashing errors during code streaming
2. **Build error toast spam** - Error notifications appearing repeatedly at the bottom
3. **Live logs not showing** - AI thinking/logs only visible after completion, not live

---

## Root Cause Analysis

### Issue 1: Preview Spazzing During Streaming
**Problem:** During code streaming, Sandpack receives incomplete/invalid code chunks every ~500ms and tries to compile them. Each failed compile triggers the `ErrorDetector` which reports a "new" error (since the message text changes slightly each time), causing rapid visual error flashing.

**Root Cause:** The `ErrorDetector` component in `VibecoderPreview.tsx` compares errors by exact string match. During streaming, the code is constantly changing and producing different error messages, so each one is treated as "new" and reported.

**Solution:** Suppress error reporting while `isStreaming` is true. Only report errors after streaming completes and the code stabilizes.

### Issue 2: Build Error Toast Spam
**Problem:** The `FixErrorToast` appears repeatedly because every error from `ErrorDetector` triggers `handlePreviewError`, which sets `showFixToast(true)` each time.

**Root Cause:** Same as Issue 1 - errors are reported too frequently during streaming. Additionally, `handlePreviewError` also calls `triggerSelfCorrection` which updates agent state, causing more re-renders.

**Solution:** Gate error handling behind streaming state - only show the toast when streaming is complete AND an error persists.

### Issue 3: Live Logs Not Showing
**Problem:** The `liveSteps` and `agentLogs` props are passed to `VibecoderChat` but **never rendered**. The component defines `LiveBuildingCard` but never uses it. The `LiveThought` component exists but is never imported.

**Root Cause:** Dead code - the rendering logic for live logs was removed or never connected. The props flow correctly from `AIBuilderCanvas` → `VibecoderChat`, but the chat component ignores them.

**Solution:** Render the `LiveThought` component (or `LiveBuildingCard`) inside `VibecoderChat` when the agent is actively running.

---

## Implementation Steps

### Step 1: Fix Preview Error Detection During Streaming
**File:** `src/components/ai-builder/VibecoderPreview.tsx`

Update the `SandpackRenderer` and `VibecoderPreview` to accept an `isStreaming` prop and pass it to `ErrorDetector`. The `ErrorDetector` will suppress error reporting while streaming is active.

Changes:
- Add `isStreaming` prop to `SandpackRenderer` component signature
- Add `isStreaming` prop to `ErrorDetector` component
- Only report errors when `isStreaming` is false
- Pass `isStreaming` from `VibecoderPreview` through to `ErrorDetector`

### Step 2: Gate Toast Display Behind Streaming State
**File:** `src/components/ai-builder/AIBuilderCanvas.tsx`

Update `handlePreviewError` to only show the toast and trigger self-correction when NOT streaming:

```typescript
const handlePreviewError = useCallback((errorMsg: string) => {
  // ONLY show error UI when streaming is complete
  if (isStreaming) return;
  
  setPreviewError(errorMsg);
  setShowFixToast(true);
  triggerSelfCorrection(errorMsg);
}, [isStreaming, triggerSelfCorrection]);
```

Also update the toast render condition to include `!isStreaming`.

### Step 3: Render Live Logs in Chat
**File:** `src/components/ai-builder/VibecoderChat.tsx`

Import and render the `LiveThought` component when the agent is actively running. The component should appear:
- After the last message in the chat
- Before the empty state (when streaming starts with no messages yet)
- Show `agentLogs` (the more comprehensive logs from the agent loop)

Changes:
- Import `LiveThought` from `./LiveThought`
- Add conditional render of `LiveThought` when `isStreaming` or `isAgentMode` is true
- Pass `agentLogs` (or fall back to `liveSteps`) and `isThinking={isStreaming}` props
- Position it at the bottom of the messages list, before the scroll anchor

---

## Technical Details

### Error Suppression Logic
The key insight is that during streaming, the code is intentionally incomplete. Errors are expected and normal. We should only surface errors when:
1. Streaming has finished (`isStreaming === false`)
2. The final compiled code still has an error
3. The error persists for at least one render cycle (debounce)

### Live Logs Data Flow
```
Edge Function SSE → useStreamingCode.onLogUpdate → setLiveSteps → AIBuilderCanvas
                                                 → onStreamLog → useAgentLoop.addLog → agentLogs
                                                 
Both paths flow to VibecoderChat via props, but currently nothing renders them.
```

### LiveThought Component Usage
The `LiveThought` component (already exists) provides:
- Collapsible log viewer with expand/collapse toggle
- Live timer showing seconds elapsed
- Auto-scroll to latest log
- Clean "Execution Log" UI with terminal styling
- Handles both active thinking and finished states

---

## Files to Modify

1. **`src/components/ai-builder/VibecoderPreview.tsx`**
   - Pass `isStreaming` prop through to ErrorDetector
   - Suppress error reporting during streaming

2. **`src/components/ai-builder/AIBuilderCanvas.tsx`**
   - Gate `handlePreviewError` behind `!isStreaming`
   - Update toast render condition

3. **`src/components/ai-builder/VibecoderChat.tsx`**
   - Import `LiveThought` component
   - Render it when agent is running or streaming
   - Position after messages, before scroll anchor

---

## Expected Outcome

After these fixes:
1. **Preview stays stable during streaming** - No error flashing, smooth code updates
2. **Toast only appears once** - Shows only after generation completes if an error persists
3. **Live logs visible in real-time** - User sees collapsible "Thought for Xs" with streaming logs as AI works

---

## Risk Assessment

**Low Risk:**
- Changes are isolated to error handling and UI rendering
- No database or backend changes
- No changes to the core streaming/generation logic
- All changes are additive (rendering existing data) or gating (suppressing premature UI)

**Testing Notes:**
- Test with a simple prompt like "Make the colors white and green"
- Verify no error spam during streaming
- Verify the thinking logs appear and update live
- Verify toast only shows if final code has an error
