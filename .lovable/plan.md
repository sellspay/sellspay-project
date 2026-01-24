
# Plan: Fix Profile Editor Section Types & Expand Functionality

## Issues Identified

### 1. Image Position Setting in Wrong Element
**Problem**: `ImageWithTextEditor` shows "Image Position" (left/right) even for layouts like Hero Banner where it doesn't apply.
**Fix**: Only show image position for `side-by-side` layout, hide for `hero` and `overlay`.

### 2. Gallery Layouts Not Working
**Problem**: Gallery presets (3x2, 2x3, Masonry) should show empty placeholders for the expected number of images.
- 3x2 Grid = 6 image slots (3 columns x 2 rows)
- 2x3 Grid = 6 image slots (2 columns x 3 rows)  
- Masonry = Variable grid layout with placeholders

**Fix**: Update `GalleryPreview` and `GalleryEditablePreview` to show placeholders based on preset layout.

### 3. Slideshow Limited to 3 Slides
**Problem**: Slideshow currently allows unlimited slides.
**Fix**: Limit slideshow to max 3 slides.

### 4. New Slideshow Elements Needed
- **Card Slideshow**: Carousel of cards
- **Banner Slideshow**: Full-width banner carousel

### 5. Collection Display Styles Not Working
**Problem**: "Product Grid" and "Product Slider" styles in `CollectionPreview` both show same grid.
**Fix**: Render actual grid vs horizontal slider based on `displayStyle`.

### 6. Testimonials Incomplete
**Problem**: 
- Missing star ratings
- Missing profile picture upload in editor
- Missing editable description
- Missing slideshow variant
- Missing 6x1 card grid

**Fix**: 
- Add `rating` (1-5) field to `TestimonialItem`
- Add avatar upload in editor
- Add slideshow layout option
- Add 6x1 cards preset

### 7. Logo List Not Working
**Problem**: No editor to add logos.
**Fix**: Add logo upload/management in `EditSectionDialog`.

### 8. Newsletter Not Working/Looking Right
**Problem**: Missing proper editor controls and styling.
**Fix**: Add editable preview for newsletter fields + proper styling.

### 9. FAQ Missing "Add Line" Feature
**Problem**: No way to add FAQ items, max 6 limit needed.
**Fix**: 
- Add "Add FAQ" button with max 6 items
- Add 3x2 layout preset (3 left, 3 right)

### 10. Contact Element Incomplete
**Problem**: Only one style, missing editor controls.
**Fix**: Add more contact style presets and proper editor.

### 11. Divider Missing Styles
**Problem**: Only line, space, dots available.
**Fix**: Add more divider styles (thick line, gradient, wave, etc.)

### 12. Footer Elements Not Working
**Problem**: No editor to manage footer columns, links, social links.
**Fix**: Add full footer editor with column/link management.

---

## Implementation Plan

### Phase 1: Fix Existing Editors

#### 1.1 ImageWithTextEditor Fix
**File**: `src/components/profile-editor/EditSectionDialog.tsx`
- Conditionally show "Image Position" only when layout is `side-by-side`
- Pass the section's `style_options.preset` or detected layout to determine visibility

#### 1.2 Gallery Editor Fix  
**Files**: 
- `src/components/profile-editor/types.ts` - Add `rows` field to `GalleryContent`
- `src/components/profile-editor/EditSectionDialog.tsx` - Show placeholder grid
- `src/components/profile-editor/previews/EditablePreview.tsx` - Show placeholder slots

```text
+---+ +---+ +---+
| 1 | | 2 | | 3 |
+---+ +---+ +---+
+---+ +---+ +---+
| 4 | | 5 | | 6 |
+---+ +---+ +---+
```

#### 1.3 Collection Preview Fix
**File**: `src/components/profile-editor/previews/SectionPreviewContent.tsx`
- Grid: Show 2x2 or 4-up grid
- Slider: Show horizontal scroll container with cards

---

### Phase 2: Expand Section Editors

#### 2.1 Slideshow Editor
**Files**: `EditSectionDialog.tsx`, `EditablePreview.tsx`
- Add slide management (max 3 slides)
- Image upload per slide
- Caption editing

#### 2.2 Testimonials Editor
**Files**: 
- `types.ts` - Add `rating?: 1|2|3|4|5` to `TestimonialItem`
- `EditSectionDialog.tsx` - Add testimonial management:
  - Avatar upload
  - Name input  
  - Role input
  - Quote textarea
  - Star rating selector (1-5)
  - Add/remove testimonials
- `SectionPreviewContent.tsx` - Render star ratings
- Add presets for slideshow and 6x1 grid

#### 2.3 Logo List Editor
**File**: `EditSectionDialog.tsx`
- Add logo upload
- Logo alt text
- Optional link URL
- Remove logo button

#### 2.4 Newsletter Editor  
**File**: `EditSectionDialog.tsx`, `EditablePreview.tsx`
- Inline edit for title, subtitle, button text, placeholder
- Proper styled preview

#### 2.5 FAQ Editor
**Files**: 
- `types.ts` - Add `layout?: 'accordion' | 'grid'` to `FAQContent`
- `EditSectionDialog.tsx`:
  - "Add FAQ" button (max 6)
  - Question input
  - Answer textarea  
  - Remove item button
- Add 3x2 grid layout preset

#### 2.6 Contact Editor
**File**: `EditSectionDialog.tsx`
- Title/subtitle inline edit
- Email input
- Toggle: Show form vs email only
- Toggle: Show social links
- Add more style presets

#### 2.7 Divider Editor
**Files**:
- `types.ts` - Expand `DividerContent.style` to include more styles
- `EditSectionDialog.tsx` - Add style dropdown
- `SectionPreviewContent.tsx` - Render new styles

New styles:
- `line` (existing)
- `space` (existing)  
- `dots` (existing)
- `thick` - Thick line
- `gradient` - Gradient line
- `zigzag` - Zigzag pattern
- `wave` - Wave pattern

#### 2.8 Footer Editor
**File**: `EditSectionDialog.tsx`
- Copyright text (inline editable)
- Toggle: Show social links
- Column management:
  - Add/remove columns (max 4)
  - Column title
  - Add/remove links per column
  - Link label + URL

---

### Phase 3: Add New Section Types

#### 3.1 Card Slideshow (`card_slideshow`)
**Files**:
- `types.ts` - Add `CardSlideshowContent` type
- `SECTION_TEMPLATES` - Add template
- `SectionPreviewContent.tsx` - Add preview
- `EditablePreview.tsx` - Add editable preview
- `EditSectionDialog.tsx` - Add editor

#### 3.2 Banner Slideshow (`banner_slideshow`)
**Files**: Same as above for banner carousel variant

---

## Files to Modify

1. `src/components/profile-editor/types.ts`
   - Add `rating` to `TestimonialItem`
   - Add `rows` to `GalleryContent`
   - Expand `DividerContent.style`
   - Add `layout` to `FAQContent`
   - Add `CardSlideshowContent` and `BannerSlideshowContent` types
   - Update `SECTION_TEMPLATES` with new presets

2. `src/components/profile-editor/EditSectionDialog.tsx`
   - Fix `ImageWithTextEditor` to conditionally show image position
   - Add `GalleryEditor` placeholder grid
   - Add `SlideshowEditor` with 3-slide limit
   - Add `TestimonialsEditor` with avatar upload, star rating
   - Add `LogoListEditor` with logo management
   - Add `NewsletterEditor` 
   - Add `FAQEditor` with add/remove items (max 6)
   - Add `ContactUsEditor`
   - Expand `DividerEditor` with more styles
   - Add `FooterEditor` with column/link management

3. `src/components/profile-editor/previews/EditablePreview.tsx`
   - Add editable previews for: Slideshow, Testimonials, Newsletter, FAQ, Contact, Footer, Logo List

4. `src/components/profile-editor/previews/SectionPreviewContent.tsx`
   - Fix `CollectionPreview` to show grid vs slider
   - Fix `GalleryPreview` to show placeholder slots
   - Add star ratings to `TestimonialsPreview`
   - Add new divider style renders
   - Add card/banner slideshow previews

---

## Technical Details

### Gallery Placeholder Logic
```typescript
// Calculate total slots based on preset
const getSlotCount = (columns: number, preset: string) => {
  if (preset === 'style1') return 6; // 3x2
  if (preset === 'style2') return 6; // 2x3  
  return columns * 2; // Default 2 rows
};

// Render empty slots when images < slotCount
const slots = Array.from({ length: slotCount }, (_, i) => images[i] || null);
```

### Star Rating Component
```typescript
const StarRating = ({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          "w-4 h-4",
          star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )}
        onClick={() => onChange?.(star)}
      />
    ))}
  </div>
);
```

### FAQ Add Item (Max 6)
```typescript
const addFAQItem = () => {
  if (content.items.length >= 6) {
    toast.error("Maximum 6 FAQ items allowed");
    return;
  }
  onChange({
    items: [...content.items, { id: crypto.randomUUID(), question: '', answer: '' }]
  });
};
```

---

## Summary

This plan addresses all reported issues:
1. Removes irrelevant image position setting from non-applicable layouts
2. Fixes gallery to show proper placeholder grids for 3x2, 2x3, masonry
3. Limits slideshow to 3 slides max
4. Adds card slideshow and banner slideshow elements  
5. Fixes collection grid vs slider rendering
6. Adds full testimonials editing (avatar, stars, text) + slideshow/6x1 presets
7. Adds logo list editor
8. Fixes newsletter editor and styling
9. Adds FAQ editor with max 6 items + 3x2 layout
10. Expands contact editor with more styles
11. Adds more divider styles
12. Adds full footer editor with column management
