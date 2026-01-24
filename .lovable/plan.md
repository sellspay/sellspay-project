
# Plan: Fix Font Styling, Add Color Picker, and Fix Visibility Persistence

## Issues Identified

### 1. Visibility State Persistence Issue
When sections are made invisible and saved, re-opening the editor doesn't reflect the saved visibility state. This happens because:
- The editor fetches fresh data from the database each time it opens
- BUT the `initialFetchDone.current` ref prevents re-fetching when the dialog re-opens in the same session
- The sections and collections state may be stale from a previous session

### 2. Missing Font Style Controls
- **Headline**: The `HeadlineEditor` in `EditSectionDialog.tsx` only has Size control - missing FontSelector
- **Text**: The `TextEditor` in `EditSectionDialog.tsx` only has Alignment control - missing FontSelector
- **Sliding Banner**: Missing FontSelector control entirely

### 3. Missing Text Color Controls
All three section types (Text, Headline, Sliding Banner) need a color picker with:
- Hue wheel for visual selection
- Hex code input for precise values

### 4. Sliding Banner Text Not Editable
The `SlidingBannerEditablePreview` component in `EditablePreview.tsx` has an issue where the inline text editor may not be working properly.

---

## Solution

### Part 1: Fix Visibility State Persistence

**File: `src/components/profile-editor/ProfileEditorDialog.tsx`**

Update the `useEffect` that manages data fetching to always fetch fresh data when the dialog opens:

- Remove the `initialFetchDone.current` guard that prevents re-fetching
- Ensure `fetchAllData()` is called every time the dialog opens with a valid `profileId`

### Part 2: Create Color Picker Component

**New File: `src/components/profile-editor/ColorPicker.tsx`**

Create a reusable color picker component with:
- Hue wheel using an HSL color model
- Saturation/Lightness picker area
- Hex code input field
- Real-time preview of selected color
- Popover-based UI to save space

```text
+----------------------------------+
|  [ Current Color Preview ]       |
|  +----------------------------+  |
|  |     Hue Wheel (circular)   |  |
|  |                            |  |
|  |   Saturation/Lightness     |  |
|  |        picker area         |  |
|  +----------------------------+  |
|  Hex: [#FFFFFF]                  |
+----------------------------------+
```

### Part 3: Update Types for Text Color

**File: `src/components/profile-editor/types.ts`**

Add `textColor` field to:
- `TextContent` interface
- `HeadlineContent` interface  
- `SlidingBannerContent` interface (already has `textColor`)

### Part 4: Add Font Style + Color to Text Section

**File: `src/components/profile-editor/EditSectionDialog.tsx`**

Update `TextEditor` component to include:
- FontSelector component
- Font Size selector
- Font Weight selector
- ColorPicker for text color

### Part 5: Add Font Style + Color to Headline Section

**File: `src/components/profile-editor/EditSectionDialog.tsx`**

Update `HeadlineEditor` component to include:
- FontSelector component
- Font Weight selector
- ColorPicker for text color

### Part 6: Add Font Style + Color to Sliding Banner

**File: `src/components/profile-editor/EditSectionDialog.tsx`**

Update `SlidingBannerEditor` component to include:
- FontSelector component
- ColorPicker for text color
- ColorPicker for background color (already in types)

### Part 7: Update Preview Components to Use Colors

**Files:**
- `src/components/profile-editor/previews/EditablePreview.tsx`
- `src/components/profile-editor/previews/SectionPreviewContent.tsx`

Update Text, Headline, and SlidingBanner preview components to:
- Apply `textColor` as inline style `color`
- Apply font styling from content

### Part 8: Fix Sliding Banner Inline Editing

**File: `src/components/profile-editor/previews/EditablePreview.tsx`**

Ensure the `SlidingBannerEditablePreview` properly handles the `InlineEdit` component for text editing:
- Make the InlineEdit clickable and visible
- Ensure the marquee animation doesn't interfere with editing

---

## Technical Details

### Color Picker Implementation

The color picker will use:
- Canvas-based hue wheel rendering
- Mouse/touch event handlers for color selection
- Conversion utilities between HSL and Hex formats
- Debounced updates to prevent performance issues

```typescript
// Core utilities needed
function hslToHex(h: number, s: number, l: number): string
function hexToHsl(hex: string): { h: number; s: number; l: number }
```

### File Changes Summary

| File | Changes |
|------|---------|
| `ProfileEditorDialog.tsx` | Fix visibility persistence by removing fetch guard |
| `types.ts` | Add `textColor` to Text and Headline interfaces |
| `ColorPicker.tsx` | New component for hue wheel color selection |
| `EditSectionDialog.tsx` | Add FontSelector and ColorPicker to Text, Headline, SlidingBanner editors |
| `EditablePreview.tsx` | Apply textColor styles, fix sliding banner editing |
| `SectionPreviewContent.tsx` | Apply textColor styles to previews |

### Import Updates

All files using the new ColorPicker will need:
```typescript
import { ColorPicker } from './ColorPicker';
```

---

## Edge Cases Handled

1. **Default colors**: If no color is set, fall back to current foreground color
2. **Invalid hex input**: Validate and sanitize hex codes before applying
3. **Custom fonts + colors**: Both should work together without conflicts
4. **Animation interference**: Pause marquee animation during inline editing
5. **Visibility toggle**: Changes persist immediately in local state AND are saved correctly to database
