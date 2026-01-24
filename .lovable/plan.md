
# Plan: Context-Aware Section Editor with Live Preview

## Problem
When clicking "Edit" on a section in the Profile Editor, users see a generic form popup that doesn't visually connect to the element they clicked. For example, clicking "Edit" on an "Image With Text" section showing "Make It Happen" opens a form with fields, not a representation of that actual element.

## Solution
Redesign the Edit Section Dialog to show a **live preview of the exact element** at the top, with editing controls below. Changes update the preview in real-time, making users feel they're directly editing the section.

## Implementation

### 1. Restructure EditSectionDialog Layout
**File**: `src/components/profile-editor/EditSectionDialog.tsx`

- Add a live preview section at the top of the dialog using `SectionPreviewContent`
- The preview updates in real-time as users modify content
- Editing controls appear below the preview in a scrollable area
- Increase dialog width to accommodate both preview and controls

```text
+------------------------------------------+
|  [x] Edit: Image With Text               |
+------------------------------------------+
|  +------------------------------------+  |
|  |                                    |  |
|  |     LIVE PREVIEW OF SECTION        |  |
|  |     (exactly as it appears)        |  |
|  |                                    |  |
|  +------------------------------------+  |
+------------------------------------------+
|  EDITING CONTROLS                        |
|  - Image upload                          |
|  - Title input                           |
|  - Body textarea                         |
|  - Button settings                       |
|  - etc.                                  |
+------------------------------------------+
|  [Delete]                    [Done]      |
+------------------------------------------+
```

### 2. Changes to EditSectionDialog

- Import `SectionPreviewContent` from `./previews/SectionPreviewContent`
- Create a temporary section state that updates in real-time for preview
- Render the `SectionPreviewContent` component at the top of the dialog
- Wrap the preview in a styled container with a subtle border/background to frame it
- Keep the existing form editors below, but now changes reflect immediately in the preview above

### 3. Dialog Sizing
- Increase `max-w-lg` to `max-w-2xl` or `max-w-3xl` to fit both preview and controls comfortably
- Ensure the dialog remains scrollable for smaller screens

## Technical Details

### Key Code Changes

**EditSectionDialog.tsx**:
```tsx
import { SectionPreviewContent } from './previews/SectionPreviewContent';

// Inside the dialog content:
<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
  <DialogHeader>
    <DialogTitle>{template?.name || 'Edit Section'}</DialogTitle>
  </DialogHeader>
  
  {/* Live Preview */}
  <div className="bg-background border border-border rounded-lg p-4 mb-4">
    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Preview</div>
    <div className="bg-card rounded-lg overflow-hidden">
      <SectionPreviewContent section={section} />
    </div>
  </div>
  
  {/* Editing Controls */}
  <ScrollArea className="flex-1">
    <div className="space-y-4">{renderEditor()}</div>
  </ScrollArea>
  
  {/* Footer */}
  <div className="flex justify-between pt-4 border-t">
    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    <Button onClick={onClose}>Done</Button>
  </div>
</DialogContent>
```

## Files to Modify
1. `src/components/profile-editor/EditSectionDialog.tsx` - Add live preview, restructure layout

## User Experience
- When clicking "Edit" on any section, users immediately see what they're editing
- Changes to form fields update the preview in real-time
- Creates a direct visual connection between the canvas element and the editor
- Feels like "in-place" editing rather than abstract form filling
