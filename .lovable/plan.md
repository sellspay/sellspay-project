

# Product Download & Attachments Enhancement Plan

## Overview

This plan addresses four key improvements to the product detail page:

1. **Download Rate Limiting**: Limit downloads to 2 per week per product per user
2. **Proper Filename Downloads**: Fix the download to use the actual filename instead of random IDs
3. **Attachments Display**: Add an "Attachments" section in the main content area showing file details with type-specific icons
4. **Page Layout Restructure**: Reorder the page to show Creator profile at top of sidebar, followed by Related Products, then a new "Featured Products" section

---

## Implementation Details

### 1. Download Rate Limiting (2 per week per product)

**Database Changes:**
- Create a new `product_downloads` table to track download events:
  - `id` (UUID, primary key)
  - `user_id` (UUID, references profiles.id)
  - `product_id` (UUID, references products.id)
  - `downloaded_at` (timestamp)
  - Unique constraint on (user_id, product_id, downloaded_at)

**Edge Function Changes (`get-download-url/index.ts`):**
- Before generating the download URL, query the `product_downloads` table
- Count downloads for this user + product in the last 7 days
- If count >= 2, return an error: "Download limit reached. You can download this product again in X days."
- If authorized, insert a new download record and proceed

**Frontend Changes (`ProductDetail.tsx`):**
- Show remaining downloads count to users (e.g., "2/2 downloads remaining this week")
- Display a friendly message when limit is reached with countdown

---

### 2. Proper Filename Downloads

**Edge Function Changes (`get-download-url/index.ts`):**
- Extract the original filename from the `download_url` path
- The storage path format is: `{creator_id}/{timestamp}-{original_filename}`
- Parse out the filename portion after the timestamp prefix
- Include `filename` in the response alongside the signed URL

**Frontend Changes (`ProductDetail.tsx`):**
- Update `handleDownload` to use the returned filename
- Instead of `window.open(data.url, '_blank')`, use the Fetch API:
  ```javascript
  const response = await fetch(data.url);
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = data.filename || 'download';
  link.click();
  ```

---

### 3. Attachments Display Section

**UI Component Changes (`ProductDetail.tsx`):**
- Move the Attachments section from the sidebar to the main content area (left column)
- Position it below the description section
- Style it similar to the reference image:
  - "Attachments" header in cyan/teal color
  - Each attachment in a rounded pill/card with:
    - File type icon (different icons for zip, rar, mp4, mp3, etc.)
    - Filename displayed
  - Lock icon for users without access
  - Multiple attachments supported in a list

**File Type Icon Mapping:**
- `.zip`, `.rar`, `.7z` - Archive icon
- `.mp4`, `.mov`, `.avi` - Video icon  
- `.mp3`, `.wav`, `.aac` - Audio/Music icon
- `.pdf` - Document icon
- `.aex`, `.prproj`, `.aep` - Project file icon
- Default - Generic file icon

**Access Logic:**
- Show lock icon for locked attachments (user hasn't purchased/followed)
- Show download icon for accessible attachments

---

### 4. Page Layout Restructure

**Current Layout:**
```
[Main Content - Left 2/3]     [Sidebar - Right 1/3]
- Media                        - Creator Card
- Title + Actions              - Attachments (purple)
- Comments                     - Related Products
- Description                  - Related Creators
- Product Type Badge
```

**New Layout:**
```
[Main Content - Left 2/3]     [Sidebar - Right 1/3]
- Media                        - Creator Card (top)
- Title + Actions              - Related Products
- Comments                     - Featured Products (NEW)
- Description
- Attachments (NEW - moved here)
- Product Type Badge
```

**Remove from Sidebar:**
- Related Creators section (declutter)
- Attachments section (moving to main content)

**Add to Sidebar:**
- Featured Products section (query products where `featured = true`, limit 5)

---

## Technical Implementation

### Database Migration

```sql
-- Create product_downloads table for rate limiting
CREATE TABLE IF NOT EXISTS public.product_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_product_downloads_user_product 
ON public.product_downloads(user_id, product_id, downloaded_at);

-- Enable RLS
ALTER TABLE public.product_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own downloads"
ON public.product_downloads FOR SELECT
USING (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Edge functions can insert downloads"
ON public.product_downloads FOR INSERT
WITH CHECK (true);
```

### Edge Function Update Summary

The `get-download-url` function will be updated to:
1. Check download count in last 7 days
2. Block if >= 2 downloads
3. Extract and return the original filename
4. Record the download event

### Frontend Changes Summary

1. **ProductDetail.tsx**:
   - Add state for download limit info
   - Update `handleDownload` to use blob download with proper filename
   - Move Attachments section to main content area with new styling
   - Add file type icon helper function
   - Add Featured Products query and section in sidebar
   - Remove Related Creators section

2. **New helper function**: `getFileTypeIcon(filename)` to return appropriate Lucide icon

---

## Files to Modify

1. **Database**: New migration for `product_downloads` table
2. **`supabase/functions/get-download-url/index.ts`**: Add rate limiting, filename extraction, download tracking
3. **`src/pages/ProductDetail.tsx`**: UI restructure, new Attachments design, Featured Products section, improved download handler

---

## User Experience

- Users will see "Attachments" section in main content showing all files with type icons
- Download button shows remaining downloads (e.g., "Download (2 left)")
- When limit reached: "Download limit reached. Try again in 3 days"
- Files download with correct names like "AEPixelSorter2.aex" instead of random UUIDs
- Sidebar shows Creator profile, Related Products, and Featured Products

