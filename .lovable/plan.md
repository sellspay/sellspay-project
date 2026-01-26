
# Plan: Product Creation Improvements

## Overview
Fix three issues with product creation: implement 5GB file size limit, add real upload progress tracking, and ensure unlimited product creation works correctly.

---

## Changes

### 1. Implement 5GB File Size Limit Per Product

**What**: Validate total file size before upload begins and show clear error if exceeded.

**Files to modify**:
- `src/pages/CreateProduct.tsx`
- `src/pages/EditProduct.tsx`

**Logic**:
- Calculate total size of all files in `downloadFiles` array
- If total exceeds 5GB (5,368,709,120 bytes), show toast error: "Total file size exceeds 5GB limit. Please reduce file size."
- Block form submission until files are reduced

---

### 2. Real Upload Progress with Time Estimate

**What**: Replace fake step-based progress with actual byte-level upload tracking using XMLHttpRequest.

**Files to modify**:
- `src/pages/CreateProduct.tsx` - new upload function with progress
- `src/pages/EditProduct.tsx` - same implementation

**New Upload Flow**:
```text
+------------------+     +-------------------+     +------------------+
|  Calculate Total | --> | Upload Each File  | --> | Create Product   |
|  File Size       |     | with XHR Progress |     | in Database      |
+------------------+     +-------------------+     +------------------+
                               |
                               v
                    +------------------------+
                    | Track: bytes uploaded, |
                    | elapsed time, speed,   |
                    | estimated remaining    |
                    +------------------------+
```

**Implementation**:
- Use `XMLHttpRequest` instead of `supabase.storage.upload()` for product files
- Track `event.loaded` vs `event.total` for each file
- Calculate upload speed (bytes/second) from elapsed time
- Show: "Uploading... X% - ~Y minutes remaining"
- Display speed: "Uploading at Z MB/s"

---

### 3. Enhanced Publishing Overlay UI

**What**: Show real metrics during upload instead of generic step labels.

**New overlay displays**:
- Circular progress with actual percentage
- Current file being uploaded (e.g., "Uploading file 2 of 5")
- Upload speed in MB/s
- Time remaining estimate
- Total bytes uploaded / total bytes

---

### 4. Update FAQ Documentation

**What**: Correct the FAQ to reflect actual 5GB limit.

**File to modify**:
- `src/pages/FAQ.tsx` - change "500MB per file" to "5GB per product"

---

## Technical Details

### Progress Upload Function
```typescript
const uploadWithProgress = (
  file: File, 
  path: string,
  onProgress: (loaded: number, total: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total);
      }
    };
    
    xhr.onload = () => xhr.status === 200 ? resolve() : reject();
    xhr.onerror = () => reject();
    
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/product-files/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.send(formData);
  });
};
```

### State for Real Progress
```typescript
const [uploadProgress, setUploadProgress] = useState({
  totalBytes: 0,
  uploadedBytes: 0,
  currentFileIndex: 0,
  totalFiles: 0,
  startTime: 0,
  speed: 0,          // bytes per second
  estimatedRemaining: 0  // seconds
});
```

---

## Files Changed Summary
| File | Changes |
|------|---------|
| `src/pages/CreateProduct.tsx` | 5GB validation, XHR upload with progress, new overlay state |
| `src/pages/EditProduct.tsx` | Same progress implementation |
| `src/pages/FAQ.tsx` | Update file size documentation |

---

## Notes
- No database changes required
- No product count limits exist - sellers can create unlimited products
- The 5GB limit is per-product (sum of all attached files), not per-file
