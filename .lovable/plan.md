
# Bug Fixes Plan: User-Reported Profile & Settings Issues

This plan addresses the 6 reported issues systematically. Each fix is explained with the root cause and solution.

---

## Issue 1: Text Resets When Tabbing to Another Window

### Root Cause
The inline edit component (`InlineEdit`) in `EditablePreview.tsx` stores text in a local `tempValue` state while editing. When the user tabs away, the browser's visibility change doesn't trigger the `onBlur` handler properly in some cases, and the `useEffect` that syncs `tempValue` with the incoming `value` prop resets the text when the component re-renders.

Additionally, the Profile page has a `visibilitychange` listener that refetches profile data when the page becomes visible again, which can cause unsaved form data to be overwritten.

### Solution
1. **Save on visibility change**: Add a visibility change handler to the `InlineEdit` component that saves the current value when the user tabs away
2. **Prevent refetch during active editing**: Add an editing state flag to prevent data refetch from overwriting form inputs while the user is actively editing

### Files to Modify
- `src/components/profile-editor/previews/EditablePreview.tsx` - Add visibility change handler to save on tab away
- `src/pages/Profile.tsx` - Add flag to prevent refetch during active editing sessions

---

## Issue 2: Banner Image Appears Zoomed (1500x500 not working, 1920x1080 works)

### Root Cause
The banner upload in `Settings.tsx` saves the raw image without any cropping, but the profile page displays banners in a container with `object-cover`. When the aspect ratio of the uploaded image (1500x500 = 3:1) doesn't match the display container's aspect ratio, the image gets cropped/zoomed to fit.

The recommended size mentions 1500x500, but the display container expects a different aspect ratio (closer to 16:9 or 1920x1080 = 16:9).

### Solution
1. **Update the recommendation text** to 1920x1080 (which matches the background recommendation and the actual display behavior)
2. **Add a banner cropper** similar to the avatar cropper to let users control exactly what portion of their image is displayed
3. **Ensure consistent aspect ratio** by using `object-contain` or a fixed aspect ratio container

### Files to Modify
- `src/pages/Settings.tsx` - Update recommended size text and optionally add banner cropper
- `src/pages/Profile.tsx` - Verify banner container aspect ratio matches expectations

---

## Issue 3: About Me Section Missing Image Upload

### Root Cause
The `AboutMeContent` type in `types.ts` only has `title`, `description`, and `showAvatar` fields. There's no `imageUrl` field for a custom image. The `AboutMePreview` component shows a generic avatar fallback with "A" instead of allowing users to upload their own photo.

### Solution
1. **Extend the `AboutMeContent` type** to include an optional `imageUrl` field
2. **Update the `AboutMeEditor`** in `EditSectionDialog.tsx` to include an image upload button
3. **Update the preview components** (`SectionPreviewContent.tsx` and `EditablePreview.tsx`) to display the uploaded image

### Files to Modify
- `src/components/profile-editor/types.ts` - Add `imageUrl?: string` to `AboutMeContent`
- `src/components/profile-editor/EditSectionDialog.tsx` - Add image upload UI to `AboutMeEditor`
- `src/components/profile-editor/previews/SectionPreviewContent.tsx` - Update `AboutMePreview` to show custom image
- `src/components/profile-editor/previews/EditablePreview.tsx` - Update editable preview for About Me

---

## Issue 4: Collection Section Not Showing Products

### Root Cause
Looking at `PublicProfileSections.tsx`, products are fetched for each collection by:
1. Fetching `collection_items` to get product IDs
2. Fetching `products` using those IDs with filter `eq("status", "published")`

The issue could be:
- Products not in "published" status
- `collection_items` table not properly linking products to collections
- Display order issues causing products to not render

The `CollectionRow.tsx` component receives products and renders them correctly, but if `products` array is empty or the items aren't properly linked, nothing shows.

### Solution
1. **Debug and log** the collection fetching to identify where products are being lost
2. **Check RLS policies** on `collection_items` to ensure proper read access
3. **Verify the query logic** properly joins collection items with products
4. **Add fallback messaging** when a collection has items linked but products aren't loading

### Files to Modify
- `src/components/profile/PublicProfileSections.tsx` - Add better error handling and logging
- Verify database RLS policies for `collection_items` table

---

## Issue 5: Gallery Masonry Layout Not Applying After Save

### Root Cause
There's a mismatch between how the gallery is rendered in different components:
- **EditablePreview.tsx** (line 302-380): Correctly implements masonry layout for `preset === 'style3'` with the proper grid structure (large left image spanning 2 rows, smaller right images)
- **SectionPreviewContent.tsx** (line 207-229): The `GalleryPreview` component doesn't check for preset or layout - it uses a simple grid based only on `columns`

When saved and viewed on the public profile, `SectionPreviewContent.tsx` is used, which ignores the masonry layout setting.

### Solution
Update `GalleryPreview` in `SectionPreviewContent.tsx` to match the logic in `EditablePreview.tsx`:
1. Accept the full `section` prop (not just content) to access `style_options.preset`
2. Implement the same masonry grid layout for `preset === 'style3'`
3. Implement the 2x3 grid for `preset === 'style2'`

### Files to Modify
- `src/components/profile-editor/previews/SectionPreviewContent.tsx` - Update `GalleryPreview` to handle presets

---

## Issue 6: Duplicate Social Links Overwrite Each Other

### Root Cause
In `Settings.tsx` lines 709-718, when saving social links, the code builds an object keyed by platform:
```typescript
socialLinksObj[detected.platform] = link.url.trim();
```

This means if a user adds two Instagram links, only the last one is saved because they both map to the `instagram` key.

### Solution
1. **Enforce one link per platform** in the UI - disable adding a new link for an already-used platform
2. **Show visual feedback** when a platform is already used (grayed out or badge indicator)
3. **Alternatively**, change the data structure to support multiple links per platform (more complex)

The simpler and more intuitive UX is to enforce one per platform with clear visual feedback.

### Files to Modify
- `src/pages/Settings.tsx` - Add platform detection when adding new links and show which platforms are already used

---

## Technical Implementation Details

### Issue 1 - InlineEdit Visibility Handler
```typescript
// Add to InlineEdit component
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && isEditing) {
      // Save on tab away
      if (tempValue !== value) {
        onChange(tempValue);
      }
      setIsEditing(false);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isEditing, tempValue, value, onChange]);
```

### Issue 5 - Gallery Preview with Presets
```typescript
const GalleryPreview = memo(({ section }: { section: ProfileSection }) => {
  const content = section.content as GalleryContent;
  const preset = section.style_options?.preset || 'style1';
  const images = content.images || [];

  // Masonry Layout (style3)
  if (preset === 'style3') {
    const slots = Array.from({ length: 4 }, (_, i) => images[i] || null);
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-2 aspect-[16/10]">
        <div className="row-span-2 rounded-lg overflow-hidden">
          {slots[0]?.url ? <img ... /> : <placeholder />}
        </div>
        {/* ... rest of masonry layout */}
      </div>
    );
  }
  // ... handle style2 (2x3) and default (3x2)
});
```

### Issue 6 - Social Link Platform Enforcement
```typescript
// Track used platforms
const usedPlatforms = socialLinks
  .map(link => detectSocialPlatform(link.url)?.platform)
  .filter(Boolean);

// In the add button, show available platforms or warn user
<Button 
  onClick={() => {
    setSocialLinks(prev => [...prev, { id: crypto.randomUUID(), url: '' }]);
  }}
  disabled={usedPlatforms.length >= 4} // All 4 platforms used
>
  {usedPlatforms.length >= 4 
    ? 'All platforms linked' 
    : '+ Add Social Link'}
</Button>
```

---

## Priority Order

1. **Issue 5** (Gallery Masonry) - Simple fix, high visibility
2. **Issue 6** (Social Links) - Simple fix, prevents data loss
3. **Issue 1** (Text Reset) - Important UX fix
4. **Issue 3** (About Me Image) - Feature addition
5. **Issue 2** (Banner Size) - UX improvement
6. **Issue 4** (Collection Products) - Requires debugging to identify root cause

---

## Files Summary

| File | Issues Addressed |
|------|-----------------|
| `src/components/profile-editor/previews/EditablePreview.tsx` | 1, 3 |
| `src/components/profile-editor/previews/SectionPreviewContent.tsx` | 3, 5 |
| `src/components/profile-editor/types.ts` | 3 |
| `src/components/profile-editor/EditSectionDialog.tsx` | 3 |
| `src/pages/Settings.tsx` | 2, 6 |
| `src/pages/Profile.tsx` | 1, 2 |
| `src/components/profile/PublicProfileSections.tsx` | 4 |
