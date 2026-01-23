

# Product Creation and Editing Fixes Plan

## Issues Identified

### Issue 1: Related Products Not Filtered by Product Type
**Current State:** The `fetchRelatedProducts` function in `ProductDetail.tsx` (lines 274-287) fetches all published products regardless of type.

**Problem:** Should only show products with the same `product_type` as the current product.

**Fix:** Modify the query to filter by `product_type` when it exists.

---

### Issue 2: Missing Product Types in Dropdown
**Current State:** The `productTypes` array in both `CreateProduct.tsx` and `EditProduct.tsx` has 8 types:
- Preset Pack, LUT Pack, Sound Effects, Music, Template, Overlay, Font, Other

**Problem:** Missing additional types that may be needed (from the ProductDetail.tsx labels, I see "tutorial" and "project_file" exist).

**Fix:** Add missing product types:
- Tutorial
- Project File
- Transition Pack
- Color Grading
- Motion Graphics

---

### Issue 3: Missing Subscription Options in EditProduct Pricing Section
**Current State:** `EditProduct.tsx` only shows "Free" and "Paid" buttons (lines 460-475).

**Problem:** Missing "Subscription Only" and "Both (One-Time + Subscription)" options that exist in `CreateProduct.tsx`.

**Fix:** Add the missing pricing options and subscription plan selection to `EditProduct.tsx` to match `CreateProduct.tsx`.

---

### Issue 4: Product File Upload Not Working
**Current State:** Files are being uploaded to a public bucket (`product-media`) with a public URL being stored.

**Problems:**
1. Download files should be stored in a private location (not public)
2. Need a separate private bucket for product files
3. Should support all file types (zip, rar, etc.) - currently no file type restrictions but the storage path goes to a public URL

**Fix:**
1. Create a new private storage bucket called `product-files` for downloadable content
2. Update the upload logic to store files as private paths (not public URLs)
3. Add RLS policies to restrict access to purchased/subscribed users
4. Create an Edge Function to generate signed download URLs for authorized users
5. Display file name/size info after upload to confirm success

---

### Issue 5: YouTube URL Displaying Video ID Instead of Full URL
**Current State:** When editing a product, the `youtubeUrl` field shows just the video ID (e.g., "Ar_9Pny937k") instead of the full URL.

**Root Cause:** The database stores just the video ID, not the full URL. The `EditProduct.tsx` loads `product.youtube_url` directly which contains only the ID.

**Fix:** 
1. When fetching the product, if `youtube_url` contains just an ID (no "youtube.com"), convert it to a full URL for display
2. When saving, extract the video ID from the full URL if needed (keep backward compatibility)
3. Also update `CreateProduct.tsx` to normalize/extract video IDs consistently

---

### Issue 6: Missing Subscription Plan Selection in Product Forms
**Current State:** When a user selects "Subscription Only" or "Both", there's no way to select which subscription plan(s) the product should be attached to.

**Fix:** Add a subscription plan selector that:
1. Fetches the creator's available subscription plans
2. Allows selecting one or more plans to attach the product to
3. Creates/updates entries in `subscription_plan_products` table on save

---

## Technical Implementation

### Database Changes
1. Create a new private storage bucket `product-files`:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-files', 'product-files', false);
```

2. Add RLS policies for the private bucket to allow:
   - Creators to upload/delete their own files
   - Buyers/subscribers to download files they have access to

### Edge Function: `get-download-url`
Create a new Edge Function that:
- Validates user authentication
- Checks if user has purchased the product OR is subscribed to a qualifying plan OR is the product owner
- Generates a signed URL for the file with a short expiration (e.g., 5 minutes)
- Returns the signed URL for download

### Frontend Changes

#### `src/pages/CreateProduct.tsx`
- Add more product types to the `productTypes` array
- Add subscription plan selection when pricing type is "subscription" or "both"
- Fetch creator's subscription plans on mount
- Update save logic to also save to `subscription_plan_products` table
- Store download files to private bucket path (not public URL)

#### `src/pages/EditProduct.tsx`
- Add more product types to the `productTypes` array
- Add "Subscription Only" and "Both" pricing options
- Add subscription plan selection section
- Add YouTube URL normalization (convert ID to full URL on load)
- Fetch and display currently linked subscription plans
- Update save logic to handle subscription plan links
- Store download files to private bucket path

#### `src/pages/ProductDetail.tsx`
- Update `fetchRelatedProducts` to filter by `product_type`
- Update download logic to call the new `get-download-url` Edge Function

### File Upload Changes
- Change the upload destination from public URL to private path
- Store as path reference (e.g., "product-files/downloads/{profile_id}/{timestamp}.zip")
- Display file name and size after successful upload
- Accept all file types (zip, rar, 7z, etc.)

---

## Implementation Order

1. **Database**: Create private storage bucket with RLS policies
2. **Edge Function**: Create `get-download-url` for secure file access
3. **EditProduct.tsx**: 
   - Add missing pricing options
   - Add product types
   - Add subscription plan selection
   - Fix YouTube URL display
   - Update file upload to private storage
4. **CreateProduct.tsx**:
   - Add product types
   - Add subscription plan selection  
   - Update file upload to private storage
5. **ProductDetail.tsx**:
   - Fix related products filtering by product_type
   - Update download to use signed URLs

---

## Summary of Changes

| File | Changes |
|------|---------|
| `storage.buckets` | Create `product-files` private bucket |
| `storage.objects` policies | Add RLS for creator uploads and authorized downloads |
| `supabase/functions/get-download-url/` | New Edge Function for signed URL generation |
| `src/pages/CreateProduct.tsx` | Add product types, subscription plan selector, private file uploads |
| `src/pages/EditProduct.tsx` | Add pricing options, product types, subscription plan selector, fix YouTube URL, private file uploads |
| `src/pages/ProductDetail.tsx` | Filter related products by type, use signed URLs for downloads |

