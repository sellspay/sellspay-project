
# Plan: Fix Visual Editor Previews to Match Section Menu Thumbnails

## Problem Summary
The visual editor previews in the Edit Section Dialog don't match the visual representation shown in the Add Section menu. This creates a confusing user experience where:

1. **Gallery Masonry** shows a simple 3x2 grid instead of the actual masonry layout (one large image spanning 2 rows on the left, smaller images stacked on the right)
2. **Multiple section types** have basic/generic previews that don't reflect the chosen preset style
3. **Some sections** show duplicated content or don't render their actual layout

## Root Cause
The `EditablePreview.tsx` component doesn't account for the `style_options.preset` value when rendering previews, while `AddSectionPanel.tsx` shows accurate stylized thumbnails for each preset.

## Solution
Update `EditablePreview.tsx` to render accurate visual representations that match each preset, using the same layout logic as the thumbnails in `AddSectionPanel.tsx`.

---

## Files to Modify

1. **`src/components/profile-editor/previews/EditablePreview.tsx`** - Complete overhaul of all preview components

---

## Detailed Changes by Section Type

### 1. Gallery (`GalleryEditablePreview`)
**Current Issue**: Shows simple grid regardless of preset
**Fix**: Implement actual masonry layout for `style3` preset

```text
MASONRY LAYOUT (style3):
+-------+---+---+
|       | 2 | 3 |
| 1     +---+---+
|       |   4   |
+-------+-------+

3x2 GRID (style1):
+---+---+---+
| 1 | 2 | 3 |
+---+---+---+
| 4 | 5 | 6 |
+---+---+---+

2x3 GRID (style2):
+---+---+
| 1 | 2 |
+---+---+
| 3 | 4 |
+---+---+
| 5 | 6 |
+---+---+
```

### 2. Collection (`CollectionEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Add proper preview showing grid vs slider based on `displayStyle`

- **Grid**: Show 2x2 product card placeholders
- **Slider**: Show horizontal row with scroll arrows

### 3. Testimonials (`TestimonialsEditablePreview`)
**Current Issue**: Only shows 2 items in a grid regardless of layout preset
**Fix**: Respect layout setting

- **grid**: 2-3 column grid
- **slider**: Single card with nav arrows
- **stacked**: Full-width stacked cards
- **grid-6**: 6 items in a row

### 4. FAQ (`FAQEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Add proper preview

- **accordion**: Show expandable accordion items
- **grid**: Show 3x2 grid of FAQ cards

### 5. Logo List (`LogoListEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Show row of logos with grayscale effect if enabled

### 6. Footer (`FooterEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Show footer layout with columns and copyright text

### 7. About Me (`AboutMeEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Add proper preview with avatar and editable text

### 8. Sliding Banner (`SlidingBannerEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Show animated marquee preview with editable text

### 9. Slideshow (`SlideshowEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Show current slide with navigation dots

### 10. Basic List (`BasicListEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Respect layout setting

- **cards-3col**: 3 column card grid
- **cards-2col**: 2 column card grid
- **horizontal**: List items with icons
- **simple**: Standard bullet/numbered list

### 11. Featured Product (`FeaturedProductEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Show product card preview

### 12. Card Slideshow (`CardSlideshowEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Show carousel of content cards

### 13. Banner Slideshow (`BannerSlideshowEditablePreview`)
**Current Issue**: Falls to default case, no preview
**Fix**: Show full-width banner with navigation

### 14. Contact (`ContactEditablePreview`)
**Current Issue**: Basic centered layout only
**Fix**: Respect style setting

- **centered**: Current layout
- **split**: Two-column layout
- **minimal**: Just email/social
- **card**: Card container style

---

## Technical Implementation

### Gallery Masonry Implementation
```typescript
function GalleryEditablePreview({ content, section }: Props) {
  const preset = section.style_options?.preset;
  const layout = content.layout || 'grid';
  
  // Masonry specific layout
  if (preset === 'style3' || layout === 'masonry') {
    return (
      <div className="grid grid-cols-3 gap-2 aspect-video">
        {/* Slot 1: Large image spanning 2 rows */}
        <div className="row-span-2 bg-muted rounded-lg">
          {slots[0]?.url ? <img ... /> : <Placeholder>1</Placeholder>}
        </div>
        {/* Slots 2-3: Top right */}
        <div className="bg-muted rounded-lg">...</div>
        <div className="bg-muted rounded-lg">...</div>
        {/* Slot 4: Bottom right, spanning 2 columns */}
        <div className="col-span-2 bg-muted rounded-lg">...</div>
      </div>
    );
  }
  
  // 2x3 grid
  if (preset === 'style2') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {slots.slice(0, 6).map(...)}
      </div>
    );
  }
  
  // Default 3x2 grid
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.slice(0, 6).map(...)}
    </div>
  );
}
```

### Collection Preview Implementation
```typescript
function CollectionEditablePreview({ content }: Props) {
  if (content.displayStyle === 'slider') {
    return (
      <div className="relative">
        <div className="flex gap-2 overflow-hidden">
          {[1,2,3].map(i => (
            <div className="w-1/3 shrink-0 bg-muted rounded-lg aspect-square" />
          ))}
        </div>
        <ChevronLeft className="absolute left-0 top-1/2 ..." />
        <ChevronRight className="absolute right-0 top-1/2 ..." />
      </div>
    );
  }
  
  // Grid layout
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {[1,2,3,4].map(i => (
        <div className="bg-muted rounded-lg aspect-square" />
      ))}
    </div>
  );
}
```

---

## Summary of Changes

| Section Type | Current State | Fix |
|-------------|---------------|-----|
| Gallery | Simple grid for all | Masonry, 3x2, 2x3 layouts |
| Collection | No preview | Grid vs Slider |
| Testimonials | Basic 2-col | Grid, Slider, Stacked, 6x1 |
| FAQ | No preview | Accordion vs 3x2 Grid |
| Logo List | No preview | Logo row with grayscale |
| Footer | No preview | Columns + copyright |
| About Me | No preview | Avatar + text |
| Sliding Banner | No preview | Marquee animation |
| Slideshow | No preview | Slide + nav dots |
| Basic List | No preview | Cards, horizontal, simple |
| Featured Product | No preview | Product card |
| Card Slideshow | No preview | Card carousel |
| Banner Slideshow | No preview | Banner carousel |
| Contact | Basic only | 4 style variations |

This will ensure the visual editor accurately represents what each section looks like, matching the thumbnails users see in the Add Section menu.
