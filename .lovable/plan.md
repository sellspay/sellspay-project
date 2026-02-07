
# VibeCoder Infrastructure Hardening Plan

## ✅ IMPLEMENTED - Status: Complete (v2)

All phases of the infrastructure hardening plan have been implemented.

---

## Latest Fixes (Session 2)

### Critical Fix: Chat Decoupling from Preview State ✅
**Problem**: When Sandpack crashed (DataCloneError, 500 errors), the entire UI was blocked because `isWaitingForPreviewMount` was part of the main transition check.

**Solution**: Split into TWO separate transition states:
1. `isProjectDataTransitioning` - Blocks ENTIRE UI (actual project switch)
2. `isPreviewLoading` - Only blocks PREVIEW pane (Sandpack initializing)

```typescript
// Data-level transition (blocks everything)
const isProjectDataTransitioning = Boolean(
  activeProjectId && (
    contentProjectId !== activeProjectId ||
    isVerifyingProject ||
    messagesLoading ||
    (lockedProjectId && lockedProjectId !== activeProjectId)
  )
);

// Preview-only transition (chat stays visible)
const isPreviewLoading = isWaitingForPreviewMount && !isProjectDataTransitioning;
```

### Safe Mode: Auto-Switch to Code View ✅
When preview times out twice (10s total), the system now:
1. Nukes all Sandpack caches
2. **Automatically switches to Code view** so user can still see their generated code
3. Shows toast with recovery instructions

### Preview-Only Loading Overlay ✅
Added a separate loading overlay for the preview pane only, so chat remains interactive during Sandpack initialization.

---

## Previously Implemented (Session 1)

### Phase 1: Enhanced Ready Detection ✅
**File**: `src/components/ai-builder/VibecoderPreview.tsx`

The `ReadyDetector` now triggers `onReady` on **both** `'idle'` and `'running'` Sandpack states.

### Phase 2: Fallback Handshake Release ✅
**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

Added a 3-second fallback timeout in `onCodeGenerated` to force-release the preview handshake.

### Phase 3: Safe Code Delivery with Size Validation ✅
**File**: `src/hooks/useAgentLoop.ts`

Added size validation and sanitization before delivering code (warns for >20k chars).

### Phase 4: Enhanced Error Boundary Reset ✅
**File**: `src/components/ai-builder/PreviewErrorBoundary.tsx`

The `handleManualReset` now calls `nukeSandpackCache()` before resetting.

### Phase 5: Aggressive Recovery with Retry Counter ✅
**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

- **1st timeout (5s)**: Releases handshake + forces Sandpack refresh
- **2nd timeout (10s)**: Nukes caches + switches to code view + shows warning

### Structural Code Guard ✅
**File**: `supabase/functions/vibecoder-orchestrator/index.ts`

- `validateCodeStructure()` validates code BEFORE delivery
- Auto-retries with healing context if validation fails

### Auto-Heal on Structural Errors ✅
**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

- `handlePreviewError` auto-triggers `healCode()` for structural Sandpack errors

---

## Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────┐
│  PROJECT DATA LOADING                                           │
│  (isProjectDataTransitioning)                                   │
│  → Blocks ENTIRE UI                                             │
│  → Covers: project switch, message loading, verification        │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│  PREVIEW INITIALIZATION                                         │
│  (isPreviewLoading)                                             │
│  → Blocks ONLY preview pane                                     │
│  → Chat sidebar remains visible and interactive                 │
│  → Timeout after 5s: Refresh Sandpack                           │
│  → Timeout after 10s: Nuke caches + switch to Code view         │
└─────────────────────────────────────────────────────────────────┘
```

## Expected Outcomes

1. **Chat history ALWAYS visible** - Even when Sandpack crashes with 500/DataCloneError
2. **Safe mode fallback** - User can view code when preview is unresponsive
3. **Automatic recovery** - Cache nuking and Sandpack remount on timeout
4. **No infinite loading** - Multiple fallback mechanisms prevent stuck states
