
# VibeCoder Infrastructure Hardening Plan

## Problem Analysis

Based on my investigation, the user is describing three cascading infrastructure failures:

### 1. DataCloneError on postMessage
The error `DataCloneError: Failed to execute 'postMessage'` suggests that when large code chunks (~15k characters) are passed between the main thread and Sandpack's web worker/iframe, the browser's structured cloning algorithm fails. This is typically caused by:
- Non-cloneable objects in the payload (functions, symbols)
- Memory pressure from very large strings
- Frozen/sealed objects that can't be cloned

### 2. 500 Internal Server Error on App.tsx
The `GET .../src/App.tsx net::ERR_ABORTED 500` error indicates Sandpack's Nodebox is crashing when trying to load the generated file. This happens when:
- The AI generates structurally invalid code
- Circular dependencies exist
- The file is too large for the sandbox container

### 3. Preview Handshake Timeout
The `Preview handshake timed out after 5s` message shows that the preview never signals readiness. Currently there's a 5-second safety timeout (line 635-644 in AIBuilderCanvas.tsx), but this is a symptom, not the cause.

## Root Causes Identified

After examining the code:

1. **VibecoderPreview.tsx (lines 158-210)**: The `ErrorDetector` component is already hardened with an IIFE pattern to avoid frozen object mutations, but the `ReadyDetector` relies on Sandpack's `status === 'idle'` which may never fire if the bundle crashes early.

2. **AIBuilderCanvas.tsx (lines 939-971)**: The auto-heal logic is implemented but depends on receiving an error message from Sandpack. If Sandpack crashes before reporting an error, auto-heal never triggers.

3. **useAgentLoop.ts (lines 300-307)**: Code is delivered via the `onCodeGenerated` callback which directly calls `setCode()`. There's no chunking or size validation.

4. **Content Gate Logic (lines 1100-1115)**: The `isProjectTransitioning` flag correctly gates rendering, but if the handshake fails, the UI stays locked in loading state.

## Proposed Solutions

### Phase 1: Chat Decoupling from Preview State

**Problem**: Chat history doesn't display because the React tree crashes when Sandpack fails.

**Solution**: Ensure the chat sidebar renders independently of the preview state. The content gate (`isProjectTransitioning`) already runs inside the content area (line 1244), not at the full component level. However, if there's a React error anywhere in the tree, it propagates up.

**Implementation**:
- Wrap `VibecoderPreview` in an additional error boundary that only affects the preview, not the chat
- Ensure `PreviewErrorBoundary` (line 1293) catches all Sandpack-related errors
- Add `onError` callback to the error boundary that triggers healing without crashing the chat

### Phase 2: Safe Code Delivery with Size Validation

**Problem**: Large code payloads (~15k chars) may cause postMessage failures.

**Solution**: Add size validation and sanitization before setting code.

**Implementation in useAgentLoop.ts**:
```typescript
// Before calling onCodeGenerated
const safeCode = typeof codeData.code === 'string' 
  ? codeData.code 
  : String(codeData.code);

// Warn if code is unusually large
if (safeCode.length > 20000) {
  console.warn('[AgentLoop] Large code payload:', safeCode.length, 'chars');
}

onCodeGenerated?.(safeCode, codeData.summary || 'Storefront generated.');
```

### Phase 3: Enhanced Ready Detection

**Problem**: The 5-second handshake timeout fires when Sandpack never reaches `idle` state.

**Solution**: Add a secondary ready signal based on iframe load events, not just Sandpack status.

**Implementation in VibecoderPreview.tsx**:
```typescript
// Inside ReadyDetector, also listen for the 'running' state as partial success
useEffect(() => {
  // 'running' means bundle succeeded, code is executing
  // This is "good enough" to release the handshake
  if ((sandpack.status === 'idle' || sandpack.status === 'running') && !hasCalledReady.current) {
    hasCalledReady.current = true;
    onReady?.();
  }
}, [sandpack.status, onReady]);
```

### Phase 4: Sandpack Refresh/Nuke Button

**Problem**: When Sandpack enters a bad state (500 errors), there's no way to recover without creating a new project.

**Solution**: Add a "Reset Preview" button that clears Sandpack's virtual file system.

**Implementation**:
1. Add a button to the error boundary that calls `sandpack.resetAllFiles()` or remounts the entire component
2. Increment `refreshKey` to force a fresh Sandpack instance
3. This already partially exists via `handleRefresh` (line 689-692) but needs to be exposed in the error UI

### Phase 5: Fail-Fast Structural Validation (Already Implemented)

The orchestrator already has `validateCodeStructure()` (lines 68-147 in vibecoder-orchestrator/index.ts) with these checks:
- Missing `export default function App` wrapper
- Hooks called before component declaration
- Unbalanced braces
- Unclosed named arrays (PRODUCTS, MOVIES, etc.)
- Hook destructuring immediately after object (danger pattern)

This was implemented in the previous session. The issue is that validation passes but the code still causes Sandpack to hang.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-builder/VibecoderPreview.tsx` | Enhance `ReadyDetector` to also trigger on `status === 'running'` |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add fallback ready trigger after code delivery |
| `src/components/ai-builder/PreviewErrorBoundary.tsx` | Add "Reset Preview" button that nukes Sandpack |
| `src/hooks/useAgentLoop.ts` | Add size validation logging for large payloads |

## Technical Implementation Details

### VibecoderPreview.tsx Changes

Current `ReadyDetector` (line 230-243):
```typescript
const ReadyDetector = forwardRef<HTMLDivElement, { onReady?: () => void }>(
  function ReadyDetector({ onReady }, ref) {
    const { sandpack } = useSandpack();
    const hasCalledReady = useRef(false);

    useEffect(() => {
      // Currently only triggers on 'idle'
      if (sandpack.status === 'idle' && !hasCalledReady.current) {
        hasCalledReady.current = true;
        onReady?.();
      }
    }, [sandpack.status, onReady]);
    // ...
  }
);
```

New implementation:
```typescript
useEffect(() => {
  // Trigger on EITHER 'idle' (bundle complete) OR 'running' (bundle succeeded, executing)
  // 'running' is a valid "ready" state - code compiled successfully
  const isReadyState = sandpack.status === 'idle' || sandpack.status === 'running';
  
  if (isReadyState && !hasCalledReady.current) {
    hasCalledReady.current = true;
    onReady?.();
  }
}, [sandpack.status, onReady]);
```

### AIBuilderCanvas.tsx Changes

Add a fallback ready trigger in the code delivery handler (around line 303-319):

```typescript
onCodeGenerated: async (generatedCode, summary) => {
  console.log('[VibeCoder 2.1] Code generated:', generatedCode.length, 'chars');
  setCode(generatedCode);
  
  // FALLBACK: If Sandpack fails to signal ready, force-release after code delivery
  // This gives a 3-second grace period for Sandpack to initialize
  setTimeout(() => {
    if (isWaitingForPreviewMount) {
      console.log('[VibeCoder 2.2] Fallback: Releasing handshake after code delivery');
      setIsWaitingForPreviewMount(false);
    }
  }, 3000);
  
  // ... rest of handler
}
```

### PreviewErrorBoundary.tsx Enhancement

Add a "Reset Preview" action:

```typescript
// In the error UI fallback
<button 
  onClick={() => {
    // Force complete remount by calling onReset
    onReset?.();
    // Additional: nuke Sandpack cache
    nukeSandpackCache();
  }}
  className="..."
>
  Reset Preview
</button>
```

## Expected Outcomes

1. **Chat history visible**: Decoupling chat from preview errors ensures messages display even when Sandpack crashes
2. **Faster recovery**: Enhanced ready detection prevents infinite loading states
3. **User control**: "Reset Preview" button gives users a way to recover from bad states
4. **Better debugging**: Size validation logging helps identify when large payloads are problematic

## Testing Strategy

1. Generate a large storefront (Netflix clone) to stress-test code size
2. Intentionally corrupt code to verify auto-heal triggers
3. Switch projects rapidly to verify handshake doesn't get stuck
4. Verify chat history persists across preview errors
