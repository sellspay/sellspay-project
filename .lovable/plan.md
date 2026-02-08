
# Chat-Integrated Undo: Premium In-Flow Version Control

## ✅ IMPLEMENTED (2026-02-08)

This system adds an always-visible "Undo Change" button directly in AI message bubbles for code-changing responses.

---

## What Was Built

### 1. Prominent Undo Pill in Message Bubble
**File: `src/components/ai-builder/VibecoderMessageBubble.tsx`**

- Added `isLatestCodeMessage` prop to identify the most recent AI response with code changes
- For the latest code message, shows an always-visible "Undo Change" button (not hover-only)
- Uses zinc-800 styling with RotateCcw icon per design spec
- Older messages still have the revert button in the hover toolbar

### 2. Smart Undo Logic with Sentinel Safety
**File: `src/components/ai-builder/hooks/useVibecoderProjects.ts`**

New functions added:
- **`undoLastChange()`** - Reverts to the second-to-last valid code snapshot
- **`canUndo()`** - Returns true if at least 2 valid snapshots exist
- **`getLastSafeVersion()`** - Returns the most recent code that passed linter (has sentinel)

Safety feature: Only reverts to code snapshots that include the `// --- VIBECODER_COMPLETE ---` sentinel, preventing restoration of truncated/broken code.

### 3. Prop Threading
**Files: `VibecoderChat.tsx`, `AIBuilderCanvas.tsx`**

- Added `canUndo` prop flowing from hook → Canvas → Chat → ChatInterface → MessageBubble
- Existing `onRestoreToVersion` handler continues to work for specific version restoration

---

## UI Behavior

```text
Most Recent AI Message (with code):
┌─────────────────────────────────────────────┐
│ I've updated the Hero with new styling...  │
│ Code applied to preview                     │
│                                             │
│ [↩ Undo Change]    ← Always visible         │
│                                             │
│ On hover: [👍] [👎] | [📋 Copy]            │
└─────────────────────────────────────────────┘

Older AI Messages (with code):
┌─────────────────────────────────────────────┐
│ Previous response content...                │
│ Code applied to preview                     │
│                                             │
│ On hover: [↩ Revert] | [👍] [👎] | [📋]    │
└─────────────────────────────────────────────┘
```

---

## Data Flow

```text
User clicks "Undo Change" on latest message
        ↓
RevertConfirmDialog shows warning
        ↓
User confirms
        ↓
onRestoreCode() triggers restoreToVersion(messageId)
        ↓
RPC deletes messages after that point, returns snapshot
        ↓
Messages refreshed, preview updates
        ↓
Toast: "Restored to previous version"
```

---

## Safety: Sentinel Check

The `canUndo()` function only counts messages where `hasCompleteSentinel(code_snapshot)` is true. This prevents:
- Restoring to truncated/incomplete code
- Restoring to code that failed the linter
- Showing undo when there's only 1 valid version

```typescript
const canUndo = useCallback((): boolean => {
  const withValidCode = messages.filter(m => 
    m.role === 'assistant' && 
    m.code_snapshot && 
    hasCompleteSentinel(m.code_snapshot)
  );
  return withValidCode.length >= 2;
}, [messages]);
```
