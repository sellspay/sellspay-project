

# Profile Editor "Add Section" Fixes - Comprehensive Plan

## Summary of Issues

Based on my exploration of the codebase, here are the issues found in the Profile Editor's "Add Section" feature:

---

## Issue 1: Collection Section - Grid/Slider Display Problems

### Current Problem
- **Grid displays 3 columns instead of 4**: The `CollectionPreview` in `SectionPreviewContent.tsx` (line 442-451) uses a hardcoded `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` class but only shows 3 placeholder products
- **Slider doesn't function as a slider**: The collection preview is just a static grid, not an actual slider
- **Display style doesn't switch between grid/slider**: The preview component ignores the `displayStyle` property from `CollectionContent`
- **Selecting a collection doesn't trigger any data loading**: The preview just shows placeholder boxes, not actual products

### Root Cause
The `CollectionPreview` component (lines 442-451) is a minimal placeholder that:
1. Ignores the `displayStyle` property (grid vs slider)
2. Shows only 4 static placeholder divs regardless of actual products
3. Has no product loading logic

### Solution
1. Update `CollectionPreview` to accept the full section object
2. Pass the actual collection products to the preview (requires fetching data or using a context)
3. Implement proper 4-column grid layout
4. Add a functional horizontal slider when `displayStyle === 'slider'`
5. Connect to collections data to show actual product thumbnails

---

## Issue 2: Featured Product - Missing Product Selection Dropdown

### Current Problem
The featured product section appears unusable because the product dropdown is empty or not working.

### Root Cause
Looking at `ProfileEditorDialog.tsx` (line 1277), products are passed as:
```typescript
products={recentProducts.map(p => ({ id: p.id, name: p.name }))}
```

The `recentProducts` array comes from `fetchRecentProducts()` which queries the creator's published products. The dropdown exists in `SectionEditorPanel.tsx` (lines 1118-1161) and should work if products are being passed.

However, there's an issue: when the section dialog (`EditSectionDialog`) is used, the `products` prop is optional and may not be consistently passed.

### Solution
1. Ensure products are always fetched and passed to both `SectionEditorPanel` and `EditSectionDialog`
2. Fetch all creator products (not just recent 6) for the dropdown
3. Update `FeaturedProductPreview` to show actual product data when a product is selected

---

## Issue 3: Button Color Customization Missing

### Current Problem
Users cannot change button colors for sections that have buttons (like Image With Text).

### Root Cause
While `ImageWithTextContent` type has `buttonColor` and `buttonTextColor` properties (lines 101-102 in types.ts), the color picker UI is not exposed in all editors that need it.

Looking at `SectionEditorPanel.tsx`, the Image With Text section editor (starting line 402) has button text and URL fields but the color picker is only partially implemented.

### Solution
1. Add `ColorPicker` component to all section editors that have buttons:
   - `image_with_text` (Hero, Side-by-side, Overlay)
   - `featured_product`
   - `newsletter`
   - `contact_us`
   - `footer`
2. Add `buttonColor` and `buttonTextColor` fields to the content types that don't have them

---

## Issue 4: Testimonials Section Not Working

### Current Problem
The testimonials section "doesn't work at all"

### Root Cause
After reviewing the code:
- `TestimonialsPreview` (lines 672-716) exists and renders correctly
- `TestimonialsEditor` exists in `EditSectionDialog.tsx`
- The editor in `SectionEditorPanel.tsx` (lines 1029-1116) allows adding testimonials

The issue is likely that:
1. The testimonials array is empty by default
2. Users may not realize they need to add testimonials manually
3. Avatar upload may not be working

### Solution
1. Add a default sample testimonial when the section is created
2. Ensure avatar upload works in the testimonial editor
3. Add star rating functionality (already in types but may not be visible)
4. Add layout switching UI (grid/slider/stacked/grid-6 layouts exist but may not be accessible)

---

## Issue 5: Logo List Not Displaying Properly

### Current Problem
Logo list/row is not rendering correctly

### Root Cause
Looking at `LogoListPreview` (lines 996-1016):
- It shows logos in a flex-wrap layout with `gap-8`
- When no logos are added, it shows "No logos added yet"

The `LogoListContent` type requires:
- `logos: LogoItem[]` (id, imageUrl, altText, linkUrl)
- `grayscale: boolean`

The issue is likely:
1. Empty logos array on creation
2. Logo upload flow may not be intuitive
3. Preview spacing/sizing may be off

### Solution
1. Improve the logo upload UI to make it clearer
2. Add placeholder slots showing where logos will appear
3. Fix logo display sizing (currently `h-12` which may be too small)
4. Add a marquee/scrolling option for better logo row display

---

## Issue 6: Footer Presets All Display The Same

### Current Problem
All three footer presets (Simple, Multi-Column, Minimal) render identically.

### Root Cause
Looking at `FooterPreview` (lines 1048-1085) in `SectionPreviewContent.tsx`:
- It always renders the same structure: columns grid + social links + text
- It doesn't check the preset style (style1, style2, style3)
- The preset ID is stored in `style_options.preset` but the preview component ignores it

The footer presets in `AddSectionPanel.tsx` (lines 492-539) show different thumbnails but the actual render logic doesn't differentiate.

### Solution
Implement distinct footer layouts based on preset:

**style1 (Simple Footer):**
- Centered social icons (circles linking to social profiles)
- Copyright text below
- No text links or columns

**style2 (Multi-Column):**
- Up to 7 columns with customizable links
- Social icons below columns (optional)
- Copyright text at bottom

**style3 (Minimal):**
- Single line of copyright text only
- No columns, no social icons
- Extremely minimal layout

---

## Implementation Tasks

### Task 1: Fix Collection Preview and Functionality
**Files to modify:**
- `src/components/profile-editor/previews/SectionPreviewContent.tsx`
  - Update `CollectionPreview` to use section prop and check `displayStyle`
  - Implement 4-column grid layout
  - Add horizontal slider functionality when `displayStyle === 'slider'`
  
### Task 2: Fix Featured Product Dropdown
**Files to modify:**
- `src/components/profile-editor/ProfileEditorDialog.tsx`
  - Fetch ALL creator products, not just recent 6
  - Pass products to all dialogs consistently
- `src/components/profile-editor/previews/SectionPreviewContent.tsx`
  - Update `FeaturedProductPreview` to display actual product data when selected

### Task 3: Add Button Color Customization
**Files to modify:**
- `src/components/profile-editor/SectionEditorPanel.tsx`
  - Add color pickers for button colors in relevant sections
- `src/components/profile-editor/EditSectionDialog.tsx`
  - Add color pickers to Image With Text, Newsletter, Contact, Featured Product editors

### Task 4: Fix Testimonials Section
**Files to modify:**
- `src/components/profile-editor/types.ts`
  - Ensure default content includes 1 sample testimonial
- `src/components/profile-editor/SectionEditorPanel.tsx`
  - Add layout selection dropdown (grid/slider/stacked)
  - Ensure star rating UI works
- `src/components/profile-editor/previews/SectionPreviewContent.tsx`
  - Implement slider layout for testimonials

### Task 5: Fix Logo List Display
**Files to modify:**
- `src/components/profile-editor/previews/SectionPreviewContent.tsx`
  - Improve logo sizing and spacing
  - Add placeholder slots when empty
- `src/components/profile-editor/EditSectionDialog.tsx`
  - Improve logo upload UI with clear slots

### Task 6: Fix Footer Presets (Critical)
**Files to modify:**
- `src/components/profile-editor/types.ts`
  - Update `FooterContent` to include `layout?: 'simple' | 'multi-column' | 'minimal'`
- `src/components/profile-editor/previews/SectionPreviewContent.tsx`
  - Complete rewrite of `FooterPreview` with three distinct layouts:
    - `SimpleFooterPreview`: Centered social icons + copyright
    - `MultiColumnFooterPreview`: Up to 7 columns + optional social icons + copyright
    - `MinimalFooterPreview`: Just one line of text
- `src/components/profile-editor/SectionEditorPanel.tsx`
  - Add footer layout editor with column management for multi-column
- `src/components/profile-editor/EditSectionDialog.tsx`
  - Update `FooterEditor` to support all three layouts

---

## Technical Considerations

### For Collection Slider
- Use CSS scroll-snap or a carousel library (embla-carousel is already installed)
- Add navigation arrows like in `HorizontalProductRow.tsx`
- Show 4 products per row

### For Footer Multi-Column
- Allow adding/removing columns (max 7)
- Each column has title and links
- Social icons use profile's social_links data
- Auto-populate with creator's configured social platforms

### For Button Colors
- Reuse existing `ColorPicker` component
- Store colors in section content: `buttonColor`, `buttonTextColor`
- Apply inline styles with fallback to theme defaults

---

## Priority Order
1. **Footer Presets** - Most critical, completely broken
2. **Collection Grid/Slider** - Core functionality broken
3. **Featured Product Dropdown** - Blocking feature
4. **Button Colors** - Enhancement
5. **Testimonials** - Fix default state
6. **Logo List** - Improve UX

