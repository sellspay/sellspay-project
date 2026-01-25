
# Profile Editor ("Launch Editor") Bug Fixes

## Overview
This plan addresses multiple issues in the Profile Editor sections, including broken previews, missing editor controls, and non-functional features across List, Gallery, Slideshow, Video, and Image With Text sections.

---

## Issues Identified and Fixes

### 1. List Section - 2 Column Showing 3 Cards Instead of 2

**Problem:** The `cards-2col` layout in `BasicListEditablePreview` creates 2 slots but in `SectionPreviewContent.tsx`, the `BasicListPreview` also creates 2 slots, but the preset logic might be inconsistent.

**Fix:** 
- Update `BasicListEditablePreview` to correctly use 2 slots for `cards-2col`
- Ensure preset `style2` consistently maps to `cards-2col` layout

---

### 2. Image With Text - Button Text and Colors Editable for All Tabs

**Problem:** The button in Hero Banner, Image Left, Image Right, and Overlay Text layouts needs editable button text AND customizable button colors.

**Fix:**
- Add editable button text via `InlineEdit` in all layout variants in `ImageWithTextEditablePreview`
- Add button color picker and text color picker fields in `SectionEditorPanel.tsx` for `image_with_text` type
- Update types to include `buttonColor` and `buttonTextColor` in `ImageWithTextContent`

---

### 3. Gallery Section - 3x2, 2x3, and Masonry Previews Are Static/Unscrollable

**Problem:** The gallery editor for 3x2, 2x3, and Masonry layouts is missing from `renderFormatTab()` - there's no `case 'gallery'` in the switch statement. Users cannot add images.

**Fix:**
- Add `case 'gallery'` to `renderFormatTab()` in `SectionEditorPanel.tsx`
- Include image upload functionality with slots based on preset:
  - `style1` (3x2): 6 image slots in 3-column grid
  - `style2` (2x3): 6 image slots in 2-column grid
  - `style3` (Masonry): 4 image slots with masonry arrangement
- Make the gallery preview scrollable by wrapping in `ScrollArea` if needed

---

### 4. Video Section - Show YouTube Preview Before Pressing Done

**Problem:** The video preview in the editor doesn't show the actual YouTube video, only a thumbnail or placeholder.

**Fix:**
- Update `VideoEditablePreview` to embed the actual YouTube iframe when a valid URL is entered
- Use the same `getYouTubeId` logic from `VideoPreview` to extract and display the embedded video

---

### 5. Slideshow - Cannot Add All 3 Images

**Problem:** The slideshow editor is missing from `renderFormatTab()` - there's no `case 'slideshow'` in the switch statement. Users cannot add slides.

**Fix:**
- Add `case 'slideshow'` to `renderFormatTab()` in `SectionEditorPanel.tsx`
- Include:
  - 3 image upload slots for slides
  - Caption input for each slide
  - Link URL input for each slide
  - Autoplay toggle
  - Interval seconds slider (1-10 seconds)
- Remove slides functionality

---

### 6. Slideshow - Preview Not Scrollable/Functional

**Problem:** The slideshow preview doesn't actually slide/carousel. Navigation arrows are non-functional.

**Fix:**
- Add state management for current slide index in `SlideshowEditablePreview`
- Make navigation arrows functional (prev/next slide)
- Add auto-play functionality with interval timer when enabled
- Update dots indicator to reflect current slide

---

### 7. Slideshow - Interval Seconds and Autoplay Toggle Not Working

**Problem:** The autoplay and interval settings exist in the type but are not exposed in the editor and don't affect the preview.

**Fix:**
- Add controls in the slideshow editor (from fix #5)
- Implement interval timer in preview component using `useEffect` with proper cleanup
- Respect `autoPlay` toggle and `interval` value

---

## Technical Implementation Details

### Files to Modify

1. **`src/components/profile-editor/types.ts`**
   - Add `buttonColor` and `buttonTextColor` to `ImageWithTextContent` interface

2. **`src/components/profile-editor/SectionEditorPanel.tsx`**
   - Add `case 'gallery'`: Gallery image uploader with preset-aware slots
   - Add `case 'slideshow'`: Slideshow editor with 3 slides, autoplay, and interval controls
   - Update `case 'image_with_text'`: Add button color and text color pickers

3. **`src/components/profile-editor/previews/EditablePreview.tsx`**
   - Update `GalleryEditablePreview`: Add `ScrollArea` wrapper for better scrolling
   - Update `VideoEditablePreview`: Embed actual YouTube iframe instead of just thumbnail
   - Update `SlideshowEditablePreview`: Add functional navigation with state, implement autoplay timer
   - Update `ImageWithTextEditablePreview`: Add editable button with color styling
   - Update `BasicListEditablePreview`: Ensure 2-column layout uses exactly 2 slots

4. **`src/components/profile-editor/previews/SectionPreviewContent.tsx`**
   - Update `SlideshowPreview`: Add functional navigation and autoplay

---

## Code Changes Summary

### SectionEditorPanel.tsx - Add Gallery Editor (after `case 'video'`)
```typescript
case 'gallery':
  const galleryImages = (section.content as any).images || [];
  const galleryPreset = section.style_options?.preset || 'style1';
  const imageCount = galleryPreset === 'style3' ? 4 : 6; // Masonry = 4, others = 6
  
  return (
    <div className="space-y-4">
      <Label>Gallery Images ({imageCount} slots)</Label>
      <div className={cn("grid gap-2", galleryPreset === 'style2' ? "grid-cols-2" : "grid-cols-3")}>
        {/* Image upload slots */}
      </div>
    </div>
  );
```

### SectionEditorPanel.tsx - Add Slideshow Editor
```typescript
case 'slideshow':
  const slides = (section.content as any).slides || [];
  return (
    <div className="space-y-4">
      {/* 3 slide upload slots with caption and link */}
      <div className="flex items-center justify-between">
        <Label>Auto Play</Label>
        <Switch checked={(section.content as any).autoPlay} ... />
      </div>
      <div>
        <Label>Interval (seconds)</Label>
        <Slider value={[(section.content as any).interval || 5]} ... />
      </div>
    </div>
  );
```

### EditablePreview.tsx - Update VideoEditablePreview
```typescript
function VideoEditablePreview({ content }: { content: VideoContent }) {
  const getYouTubeId = (url: string) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/|\/watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };
  
  const videoId = getYouTubeId(content.videoUrl || '');
  
  return (
    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
      {videoId ? (
        <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" ... />
      ) : (
        <ImagePlaceholder label="Enter YouTube URL" />
      )}
    </div>
  );
}
```

### EditablePreview.tsx - Update SlideshowEditablePreview
```typescript
function SlideshowEditablePreview({ content }: { content: SlideshowContent }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = content.slides || [];
  
  // Autoplay effect
  useEffect(() => {
    if (!content.autoPlay || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, (content.interval || 5) * 1000);
    return () => clearInterval(interval);
  }, [content.autoPlay, content.interval, slides.length]);
  
  // Functional navigation arrows
  // Show current slide based on index
}
```

---

## Validation Checklist

After implementation, verify:

- [ ] List 2-column shows exactly 2 cards
- [ ] Image With Text button text is editable inline
- [ ] Image With Text has button color/text color controls
- [ ] Gallery 3x2 can upload 6 images
- [ ] Gallery 2x3 can upload 6 images  
- [ ] Gallery Masonry can upload 4 images
- [ ] Video preview shows actual YouTube embed
- [ ] Slideshow can add 3 images
- [ ] Slideshow navigation arrows work
- [ ] Slideshow dots reflect current slide
- [ ] Slideshow autoplay toggle functions
- [ ] Slideshow interval slider functions
- [ ] All previews scroll properly if content overflows
