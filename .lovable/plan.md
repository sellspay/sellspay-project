
# Implementation Plan: UI Cleanup + Hard Refresh Fix for White Screen of Death

## Problem Summary

1. **White Screen of Death**: When the Sandpack preview stalls or crashes, users see a blank white canvas with no way to recover. The AI cannot fix this since it's a runtime freeze, not a syntax error.

2. **UI Redundancy**: Undo/Redo buttons appear in multiple places (Canvas Toolbar AND Chat Header), creating confusion about which to use.

## Solution Overview

We will:
1. **Remove Undo/Redo from Canvas Toolbar** - Keep only project identity in the left section
2. **Add a Refresh button** to the address bar that triggers a Hard Refresh
3. **Implement the "key reset" pattern** - Changing the key on `VibecoderPreview` forces React to destroy and recreate the component, fixing white screens

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Canvas Toolbar                                                                  │
│  [S] Project ▾       │  [Preview] [Code] │ 📱 💻  │  🟢 /ai-builder  ↻          │
│  ↑ No Undo/Redo      │       Center       │        │         ↑ REFRESH BUTTON    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**The Refresh Button (↻)** in the address bar will:
- Increment a `refreshKey` state variable
- Pass this key to `VibecoderPreview`
- React sees the key change and destroys/rebuilds the component
- This clears stuck state, infinite loops, or renderer crashes

---

## Part 1: Update CanvasToolbar.tsx

**Changes:**

1. **Remove imports for Undo2, Redo2** - No longer needed
2. **Add RefreshCw import** - For the refresh button icon
3. **Remove history control props** - onUndo, onRedo, canUndo, canRedo
4. **Add onRefresh prop** - New callback for Hard Refresh
5. **Remove the "History Controls" section** from left side
6. **Add Refresh button** to the address bar section (right side)

**Updated Props Interface:**
```typescript
interface CanvasToolbarProps {
  viewMode: 'preview' | 'code';
  setViewMode: (mode: 'preview' | 'code') => void;
  projectName?: string;
  deviceMode?: 'desktop' | 'mobile';
  setDeviceMode?: (mode: 'desktop' | 'mobile') => void;
  onRefresh: () => void;  // NEW - triggers hard refresh
}
```

**Key UI Changes:**
- Left section: Only project name pill (no undo/redo)
- Right section: Address bar now includes a clickable RefreshCw icon with hover effects

---

## Part 2: Update AIBuilderCanvas.tsx

**Changes:**

1. **Add refreshKey state** - Starts at 0, incremented on refresh
2. **Create handleRefresh function** - Increments refreshKey
3. **Update CanvasToolbar props** - Remove undo/redo, add onRefresh
4. **Update VibecoderPreview key** - Include refreshKey in the component key

**Code Updates:**

```typescript
// Add state for hard refresh
const [refreshKey, setRefreshKey] = useState(0);

// Handler to force preview recreation
const handleRefresh = useCallback(() => {
  setRefreshKey(prev => prev + 1);
}, []);

// Update CanvasToolbar (remove undo/redo props)
<CanvasToolbar
  viewMode={viewMode}
  setViewMode={setViewMode}
  projectName={activeProject?.name}
  deviceMode={deviceMode}
  setDeviceMode={setDeviceMode}
  onRefresh={handleRefresh}  // NEW
/>

// Update VibecoderPreview key to include refreshKey
<VibecoderPreview 
  key={`preview-${activeProjectId}-${resetKey}-${refreshKey}`}
  // ... rest of props
/>
```

---

## Part 3: VibecoderChat (No Changes Needed)

The chat panel already has its own Undo button in the header, which is the correct single location for this functionality. No changes are required here.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/ai-builder/CanvasToolbar.tsx` | Remove Undo/Redo, add Refresh button with handler |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add refreshKey state, handleRefresh, update props |

---

## Why This Fixes the White Screen

When a user clicks the refresh icon:

1. `refreshKey` changes from `0` to `1`
2. The `key` prop on `VibecoderPreview` becomes different
3. React treats it as a **completely new component**
4. React **destroys** the old stuck iframe entirely
5. React **creates** a fresh preview instance

This clears:
- Stuck memory from infinite loops
- Crashed renderer state
- Stalled Sandpack server connections
- Any silent JavaScript errors

---

## Expected Result

**Before**: User sees white screen with no recovery option except page refresh

**After**: User clicks small ↻ icon in address bar → preview instantly rebuilds → problem solved
