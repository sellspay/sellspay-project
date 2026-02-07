
# VibeCoder Infrastructure Hardening Plan

## ✅ IMPLEMENTED - Status: Complete

All phases of the infrastructure hardening plan have been implemented.

---

## Fixes Applied

### Phase 1: Enhanced Ready Detection ✅
**File**: `src/components/ai-builder/VibecoderPreview.tsx`

The `ReadyDetector` now triggers `onReady` on **both** `'idle'` and `'running'` Sandpack states. This prevents infinite loading when the bundle succeeds but stays in 'running' mode.

```typescript
const isReadyState = sandpack.status === 'idle' || sandpack.status === 'running';
if (isReadyState && !hasCalledReady.current) {
  hasCalledReady.current = true;
  onReady?.();
}
```

### Phase 2: Fallback Handshake Release ✅
**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

Added a 3-second fallback timeout in `onCodeGenerated` to force-release the preview handshake if Sandpack crashes or hangs:

```typescript
setTimeout(() => {
  setIsWaitingForPreviewMount(prev => {
    if (prev) console.log('[VibeCoder 2.2] Fallback: Releasing handshake');
    return false;
  });
}, 3000);
```

### Phase 3: Safe Code Delivery with Size Validation ✅
**File**: `src/hooks/useAgentLoop.ts`

Added size validation and sanitization before delivering code:
- Ensures code is always a string (prevents DataCloneError)
- Logs warnings for payloads >20k chars
- Displays warning in agent logs

### Phase 4: Enhanced Error Boundary Reset ✅
**File**: `src/components/ai-builder/PreviewErrorBoundary.tsx`

The `handleManualReset` now calls `nukeSandpackCache()` before resetting, ensuring a clean slate when recovering from crashes:
- Clears all Sandpack/CSB IndexedDB caches
- Clears vibecoder-related localStorage
- Forces complete Sandpack remount

---

## Previously Implemented (from prior session)

### Structural Code Guard
**File**: `supabase/functions/vibecoder-orchestrator/index.ts`

- `validateCodeStructure()` function validates code BEFORE delivery
- Checks for missing `export default function App` wrapper
- Detects hooks called before component declaration
- Validates bracket balance and named array closures
- Auto-retries with healing context if validation fails

### Auto-Heal on Structural Errors
**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

- `handlePreviewError` auto-triggers `healCode()` for structural Sandpack errors
- Detects: `Unexpected token`, `SyntaxError`, `is not defined`, `Cannot use import`, etc.
- Non-structural runtime errors still show manual "Fix" button

### Enhanced Builder Prompt
**File**: `supabase/functions/vibecoder-builder/index.ts`

- "Tape the Box Shut" model for data arrays
- Strict hook placement rules (only inside App component)
- SellsPay marketplace context

---

## Expected Outcomes

1. **Chat history visible**: Decoupled from preview errors
2. **Faster recovery**: Enhanced ready detection prevents infinite loading
3. **User control**: "Reset Preview" nukes Sandpack cache
4. **Better debugging**: Size validation warns of large payloads
5. **Structural integrity**: Server-side validation rejects broken code
