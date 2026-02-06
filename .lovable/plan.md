
# Implementation Plan: Canvas Toolbar with Preview/Code View Toggle

This plan adds a professional canvas toolbar that allows users to switch between **Preview** (visual site) and **Code** (raw TSX) views, plus device simulation toggles and undo/redo controls.

---

## Overview

Currently, the AI Builder only shows the Preview pane. Users cannot see the raw code the AI generates. We'll add:

1. **View Mode State** - Track whether user wants Preview or Code view
2. **Canvas Toolbar Component** - A professional dark pill toolbar with view switcher
3. **Conditional Rendering** - Show either `SandpackPreview` or `SandpackCodeEditor` based on mode

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Header (Exit, Logo, Publish)                                                    │
├──────┬──────────────────────────────────────────────────────────────────┬───────┤
│      │  ┌────────────────── Canvas Toolbar ──────────────────┐          │       │
│      │  │ [S] Project Name ▾ │ ← → │ [Preview] [Code] │ 📱 💻 │         │       │
│ Proj │  └─────────────────────────────────────────────────────┘          │       │
│ Side │                                                                   │ Chat  │
│ bar  │                    Preview OR Code Editor                         │ Panel │
│      │                    (based on viewMode)                            │       │
│      │                                                                   │       │
└──────┴───────────────────────────────────────────────────────────────────┴───────┘
```

---

## Part 1: Create the CanvasToolbar Component

### New File: `src/components/ai-builder/CanvasToolbar.tsx`

A sleek dark toolbar with:
- **Left Section**: Project name pill with logo icon + Undo/Redo buttons
- **Center Section**: The "Lovable-style" view switcher pill (Preview | Code) + device toggles
- **Right Section**: Simulated browser address bar with route display

**Key UI Elements:**
- Dark zinc-900 background with subtle border
- Blue accent (`bg-blue-600`) for active Preview button
- Muted zinc-800 for active Code button
- Disabled state for undo/redo when not available

**Props:**
```typescript
interface CanvasToolbarProps {
  viewMode: 'preview' | 'code';
  setViewMode: (mode: 'preview' | 'code') => void;
  projectName?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  deviceMode?: 'desktop' | 'mobile';
  setDeviceMode?: (mode: 'desktop' | 'mobile') => void;
}
```

---

## Part 2: Update VibecoderPreview to Support Dual Modes

### File: `src/components/ai-builder/VibecoderPreview.tsx`

**Changes:**
1. Add a new prop: `viewMode: 'preview' | 'code'` (default: `'preview'`)
2. Import `SandpackCodeEditor` from `@codesandbox/sandpack-react`
3. Inside `SandpackRenderer`, conditionally render:
   - `viewMode === 'preview'` → Show `SandpackPreview` (current behavior)
   - `viewMode === 'code'` → Show `SandpackCodeEditor` with syntax highlighting

**SandpackCodeEditor Configuration:**
```typescript
<SandpackCodeEditor 
  showTabs={true}
  showLineNumbers={true}
  showInlineErrors={true}
  wrapContent={true}
  readOnly={true}  // Users view AI code, not edit directly
  className="h-full w-full flex-1"
  style={{ height: '100%' }}
/>
```

---

## Part 3: Integrate into AIBuilderCanvas

### File: `src/components/ai-builder/AIBuilderCanvas.tsx`

**Changes:**

1. **Add State:**
   ```typescript
   const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
   const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
   ```

2. **Import CanvasToolbar:**
   ```typescript
   import { CanvasToolbar } from './CanvasToolbar';
   ```

3. **Update Preview Panel Layout:**
   - Add the `<CanvasToolbar>` at the top of the preview panel
   - Pass `viewMode` and `setViewMode` props
   - Pass `canUndo` and `onUndo` from existing handlers
   - Pass `projectName` from `activeProject?.name`

4. **Pass viewMode to VibecoderPreview:**
   ```typescript
   <VibecoderPreview 
     code={code} 
     isStreaming={isStreaming}
     viewMode={viewMode}  // NEW PROP
     onError={...}
   />
   ```

---

## Part 4: Device Mode Simulation (Bonus)

When `deviceMode === 'mobile'`:
- Wrap the preview in a container with `max-w-[375px]` and centered positioning
- Add a subtle phone frame border

This is optional and can be a future enhancement - the core implementation will focus on the Preview/Code toggle.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/ai-builder/CanvasToolbar.tsx` | **New file** - The toolbar component |
| `src/components/ai-builder/VibecoderPreview.tsx` | Add `viewMode` prop, conditionally render Preview or CodeEditor |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add state for viewMode/deviceMode, integrate toolbar |
| `src/components/ai-builder/index.ts` | Export new CanvasToolbar component |

---

## Expected Result

**Default View (Preview):**
- User sees the live rendered storefront
- "Preview" button is highlighted blue in the toolbar
- Code button is muted/grey

**Code View:**
- User clicks "Code" button
- The preview is replaced with a full-height code editor
- Syntax highlighting shows the AI-generated TSX
- Code is read-only (users can't edit directly)

**Toolbar Features:**
- Undo/Redo buttons for version control
- Project name displayed with logo
- Device toggle icons (desktop/mobile) for responsive preview
- Simulated address bar showing `/ai-builder`
