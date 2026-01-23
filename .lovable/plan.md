
# Profile Editor Redesign: Modal Add Section Panel + Footer Section

## Overview
This plan transforms the "Add New Section" panel from a fullscreen overlay to a modal window that appears over the profile editor (similar to the reference images), adds instant preview of presets on the profile background, and introduces a new Footer section type for creators.

## Key Changes

### 1. Convert Add Section Panel to Modal Dialog

**Current Issue**: The Add Section panel (`AddSectionPanel.tsx`) renders as a fullscreen overlay (`fixed inset-0`), which takes users completely away from the editor context.

**Solution**: Convert to a modal dialog using the existing `Dialog` component with a large width (approx. 800-900px), positioned centered over the editor. This keeps the editor visible in the background, matching the reference screenshots.

**Implementation**:
- Replace the fullscreen `div` with `Dialog` + `DialogContent` components
- Use custom sizing: `max-w-4xl w-[95vw] h-[80vh]` for large modal
- Remove the header X button (Dialog provides its own)
- Keep the split-panel layout (sidebar + presets) inside the modal

### 2. Instant Preset Preview on Background

**Current Issue**: When clicking a preset, the section is added immediately and the panel closes. Users cannot preview how different presets will look before committing.

**Solution**: Add a hover/click preview mode that temporarily shows the preset on the editor canvas before final selection.

**Implementation**:
- Add `hoveredPreset` state to track which preset is being previewed
- Pass a `onPreviewSection` callback from `ProfileEditorDialog` to `AddSectionPanel`
- On preset hover, create a temporary preview section and display it in the sections list
- On preset click, commit the section (current behavior)
- Visual indicator: highlight the preview section with a dashed border and "Preview" badge

### 3. Add Footer Section Type

**Purpose**: Allow creators to add a customizable footer to their profile page with links, copyright text, and branding.

**New Types** (in `types.ts`):
```text
FooterContent {
  text: string;              // e.g., "2026 Store Name. All rights reserved."
  showSocialLinks: boolean;
  columns: FooterColumn[];   // Up to 3 columns with links
  backgroundColor?: string;
}

FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

FooterLink {
  id: string;
  label: string;
  url: string;
}
```

**Template Configuration**:
- Add `'footer'` to `SectionType` union
- Add Footer template to `SECTION_TEMPLATES` in `types.ts`
- Category: `'layout'`
- Icon: `'LayoutGrid'` or similar
- Presets: "Simple", "Multi-Column", "Minimal"

**Preview Component** (in `SectionPreviewContent.tsx`):
- Create `FooterPreview` component showing columns and links
- Render copyright text centered below columns

### 4. Fix Editor Dead Space Issue

**Current Issue**: The background does not fill the entire viewport and there is visible dead space below the card.

**Solution**: Ensure the main content area uses proper height calculations:
- The dialog content: `h-[100vh]` (full viewport)
- The scrollable area: `h-[calc(100vh-57px)]` (minus header)
- The background div: `absolute inset-0` (already correct)

### 5. Section Type Sidebar Structure

Update the sidebar to match reference images with these categories:
- **Saved Sections** (for user-saved custom sections - future feature placeholder)
- **Image With Text**
- **Gallery**
- **Slideshow**
- **Image**
- **Text**
- **Basic List**
- **Slider List**
- **Video**
- **Featured Product**
- **Featured Collection**
- **Featured Collection List**
- **Featured Blog Posts**
- **Testimonials**
- **Logo List**
- **Contact Us**
- **Newsletter**
- **FAQs**
- **About Me**
- **Collage**
- **Embed Code**
- **Footer** (new)

---

## Technical Implementation

### Files to Modify

1. **`src/components/profile-editor/types.ts`**
   - Add `'footer'` to `SectionType` union
   - Add `FooterContent`, `FooterColumn`, `FooterLink` interfaces
   - Add Footer to `SectionContent` union
   - Add Footer template to `SECTION_TEMPLATES` array

2. **`src/components/profile-editor/AddSectionPanel.tsx`**
   - Convert from fullscreen div to `Dialog` + `DialogContent`
   - Update container styling for modal appearance
   - Add hover preview functionality
   - Add Footer presets to `PRESET_PREVIEWS`

3. **`src/components/profile-editor/ProfileEditorDialog.tsx`**
   - Add `previewSection` state for temporary preview
   - Pass `onPreviewSection` callback to AddSectionPanel
   - Render preview section with visual distinction
   - Fix any remaining layout issues for full viewport coverage

4. **`src/components/profile-editor/previews/SectionPreviewContent.tsx`**
   - Add `FooterPreview` component
   - Add case for `'footer'` in switch statement

### Modal Layout Structure

```text
+----------------------------------+
|  Add New Section           [X]  |  <- Dialog Header
+----------------------------------+
|  Sidebar   |   Preset Cards     |
|  --------  |   [1] Hero Banner  |
|  > Text    |   [2] Image Left   |
|  > Image   |   [3] Image Right  |
|  > Gallery |   [4] Overlay      |
|  > Video   |   ...              |
|  ...       |                    |
|  > Footer  |                    |
+----------------------------------+
```

### Footer Section Presets

**Preset 1: Simple Footer**
- Single line with copyright text
- Optional social icons

**Preset 2: Multi-Column**
- 2-3 columns with link lists
- Column headers
- Copyright below

**Preset 3: Minimal**
- Just copyright text centered
- Clean, minimal design

### State Flow for Preview

1. User opens Add Section modal
2. User selects section type from sidebar
3. User hovers over a preset card
4. `onPreviewSection(type, presetId)` is called
5. `ProfileEditorDialog` creates temporary section and adds to preview list
6. Preview section renders with dashed border + "Preview" label
7. User clicks preset to confirm OR moves away to cancel preview
8. On confirm: section is saved to database, preview is replaced with real section
9. On cancel (close modal): preview section is removed

---

## Summary

This redesign transforms the Add Section experience to match professional store builders like Shopify, with:
1. A centered modal dialog instead of fullscreen takeover
2. Live preview of presets on the editor canvas before committing
3. A new Footer section type for complete store customization
4. Proper full-viewport editor layout with no dead space
