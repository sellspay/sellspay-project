
# Plan: Refactor Profile Editor to Payhip-Style Architecture

## Current Problems Identified

### 1. **No Autosave - Changes Get Lost**
- Currently relies on manual "Save" button
- User must remember to save before closing
- Changes feel fragile and unreliable
- The `hasChanges` flag resets on dialog close but actual data may not persist

### 2. **Preview State Leaking Across Sessions**
- `previewSection` state persists when it shouldn't
- Elements appear stuck on the canvas even after closing
- State cleanup is incomplete

### 3. **Inconsistent Data Flow**
- Local state (sections, collections) gets out of sync with database
- After saving, the editor doesn't always re-fetch fresh data
- Public profile may show correct data while editor shows stale data

### 4. **Missing Payhip-Style Features**
- No undo/redo history
- No auto-save with debounce
- No clear visual feedback during save operations
- No "last saved" timestamp display

---

## Solution Architecture (Following Payhip Model)

### Mental Model
```
+---------------------------+
|       Header Toolbar      |
|  [Undo] [Redo] [Save] [X] |
|  "Last saved 2 min ago"   |
+---------------------------+
|                           |
|     Canvas (Sections)     |
|  - Drag to reorder        |
|  - Click to edit inline   |
|  - Hover for controls     |
|                           |
+---------------------------+
|    [+ Add Section]        |
+---------------------------+
```

### Key Architectural Changes

1. **Debounced Autosave**
   - Save changes automatically after 1.5s of inactivity
   - Show visual feedback: "Saving..." → "Saved ✓"
   - Eliminate manual save anxiety

2. **Local History Stack (Undo/Redo)**
   - Track state changes in a history array
   - Enable Cmd/Ctrl+Z for undo
   - Enable Cmd/Ctrl+Shift+Z for redo

3. **Single Source of Truth**
   - All changes go through a central `dispatch` function
   - State updates are atomic and predictable
   - After autosave, update local state with server response

4. **Clean State Management**
   - Clear preview/editing states on dialog mount (not just on open)
   - Use `useEffect` cleanup functions properly
   - Prevent state leakage between sessions

---

## Implementation Steps

### Phase 1: Fix State Leakage Issues

**File: `src/components/profile-editor/ProfileEditorDialog.tsx`**

1. **Reset all state on dialog mount, not just open**
```typescript
useEffect(() => {
  if (open) {
    // Reset ALL temporary states
    setPreviewSection(null);
    setEditingSection(null);
    setEditingCollection(null);
    setShowAddPanel(false);
    setHasChanges(false);
    // Fetch fresh data
    fetchAllData();
  }
  
  // Cleanup on unmount
  return () => {
    setPreviewSection(null);
    setEditingSection(null);
    setEditingCollection(null);
  };
}, [open, profileId]);
```

2. **Ensure preview section is ONLY shown when AddSectionPanel is active**
```typescript
// Already fixed in previous edit, but verify this logic
{showAddPanel && previewSection && (
  <div className="relative bg-card/50 ...">
    ...
  </div>
)}
```

3. **Clear preview on ANY panel close action**
```typescript
const closeAddPanel = useCallback(() => {
  setPreviewSection(null);
  setShowAddPanel(false);
}, []);
```

### Phase 2: Implement Autosave with Debounce

**New hook: `src/hooks/useAutoSave.ts`**

```typescript
import { useCallback, useRef, useEffect, useState } from 'react';

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  debounceMs = 1500
) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  const save = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await saveFn(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
      // Reset to idle after 2s
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Autosave failed:', error);
    }
  }, [data, saveFn]);

  useEffect(() => {
    // Only trigger if data actually changed
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      previousDataRef.current = data;
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new debounced save
      timeoutRef.current = setTimeout(save, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, debounceMs]);

  return { saveStatus, lastSaved };
}
```

**Update ProfileEditorDialog.tsx to use autosave:**

```typescript
const { saveStatus, lastSaved } = useAutoSave(
  { sections, editorCollections, showRecentUploads },
  saveAllChanges,
  1500
);
```

### Phase 3: Add Undo/Redo History

**New hook: `src/hooks/useHistory.ts`**

```typescript
import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T, maxHistory = 50) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const current = history[index];

  const push = useCallback((newState: T) => {
    setHistory(prev => {
      // Remove any "future" states if we branched
      const newHistory = prev.slice(0, index + 1);
      // Add new state
      newHistory.push(newState);
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      return newHistory;
    });
    setIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [index, maxHistory]);

  const undo = useCallback(() => {
    setIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return { current, push, undo, redo, canUndo, canRedo };
}
```

**Integrate with ProfileEditorDialog:**

```typescript
const {
  current: editorState,
  push: pushHistory,
  undo,
  redo,
  canUndo,
  canRedo,
} = useHistory({ sections: [], collections: [] });

// Listen for keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo]);
```

### Phase 4: Update UI with Save Status

**Header toolbar updates:**

```typescript
<div className="flex items-center gap-3">
  {/* Save status indicator */}
  <span className="text-xs text-muted-foreground">
    {saveStatus === 'saving' && (
      <span className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving...
      </span>
    )}
    {saveStatus === 'saved' && (
      <span className="flex items-center gap-1 text-green-500">
        <Check className="w-3 h-3" />
        Saved
      </span>
    )}
    {saveStatus === 'error' && (
      <span className="flex items-center gap-1 text-destructive">
        <AlertCircle className="w-3 h-3" />
        Save failed
      </span>
    )}
    {saveStatus === 'idle' && lastSaved && (
      <span>Last saved {formatDistanceToNow(lastSaved)} ago</span>
    )}
  </span>
  
  {/* Undo/Redo buttons */}
  <Button 
    variant="ghost" 
    size="icon" 
    onClick={undo} 
    disabled={!canUndo}
  >
    <Undo className="w-4 h-4" />
  </Button>
  <Button 
    variant="ghost" 
    size="icon" 
    onClick={redo} 
    disabled={!canRedo}
  >
    <Redo className="w-4 h-4" />
  </Button>
  
  {/* Close button */}
  <Button variant="ghost" size="icon" onClick={handleClose}>
    <X className="w-5 h-5" />
  </Button>
</div>
```

### Phase 5: Improve Save Logic Reliability

**Update saveAllChanges to return fresh data:**

```typescript
const saveAllChanges = async () => {
  try {
    // Save sections and get fresh data back
    const sectionPromises = sections.map(async (section) => {
      const { data, error } = await supabase
        .from('profile_sections')
        .update({
          display_order: section.display_order,
          content: JSON.parse(JSON.stringify(section.content)),
          style_options: JSON.parse(JSON.stringify(section.style_options || {})),
          is_visible: section.is_visible,
        })
        .eq('id', section.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
    
    const updatedSections = await Promise.all(sectionPromises);
    
    // Update local state with server response
    setSections(updatedSections as unknown as ProfileSection[]);
    
    // ... similar for collections
    
    toast.success('Changes saved');
  } catch (error) {
    console.error('Save error:', error);
    toast.error('Failed to save changes');
    throw error; // Re-throw for autosave error handling
  }
};
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useAutoSave.ts` | Create | Debounced autosave hook |
| `src/hooks/useHistory.ts` | Create | Undo/redo history management |
| `src/components/profile-editor/ProfileEditorDialog.tsx` | Modify | Integrate autosave, history, fix state leaks |
| `src/components/profile-editor/AddSectionPanel.tsx` | Modify | Ensure clean preview state handling |

---

## Technical Notes

### Debounce Implementation
- Use 1500ms delay (Payhip uses similar timing)
- Skip save if data hasn't changed (deep comparison)
- Show immediate visual feedback

### History Stack
- Limit to 50 states to prevent memory issues
- Clear history when dialog closes
- Snapshot entire editor state (sections + collections)

### State Cleanup Checklist
- Clear `previewSection` when AddPanel closes
- Clear `editingSection` when EditDialog closes
- Clear all temporary state when main dialog closes
- Use cleanup functions in useEffect

---

## Summary

This refactor transforms the profile editor from a manual-save model to a Payhip-style autosave experience:

1. **Autosave with debounce** - Changes save automatically after 1.5s of inactivity
2. **Undo/Redo** - Keyboard shortcuts Cmd+Z and Cmd+Shift+Z work
3. **Visual feedback** - "Saving..." → "Saved ✓" indicators in toolbar
4. **State isolation** - No more phantom preview elements appearing
5. **Reliable persistence** - Data syncs properly between editor and public profile

The implementation follows React best practices with custom hooks for reusability and clean separation of concerns.
