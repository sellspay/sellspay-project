
# Fix VideoFrameSelector & Premium Pricing Buttons

## Overview
This plan addresses two issues:
1. The "Select Frame from Preview Video" feature isn't working in the Create Product flow
2. The Pricing section buttons need a more premium design

---

## Issue 1: VideoFrameSelector Not Working

### Root Cause Analysis
The `VideoFrameSelector` component has several issues preventing proper frame capture:

1. **CORS Issue**: Canvas cannot capture video frames without `crossOrigin="anonymous"` attribute on the video element
2. **Initial Frame Not Loading**: The component relies on `onSeeked` event to capture frames, but this doesn't fire on initial load - only when user seeks
3. **Missing Error Handling**: No fallback if video fails to load

### Technical Fix

**File: `src/components/product/VideoFrameSelector.tsx`**

```typescript
// Add crossOrigin attribute to video element
<video
  ref={videoRef}
  src={videoSrc}
  crossOrigin="anonymous" // ADD THIS
  className="hidden"
  onLoadedMetadata={handleLoadedMetadata}
  onLoadedData={handleLoadedData} // ADD THIS - triggers on first frame ready
  onSeeked={handleSeeked}
  muted
  playsInline
  preload="auto" // ADD THIS
/>

// Add new handler for initial frame capture
const handleLoadedData = () => {
  // Capture the first frame immediately when video data is ready
  const result = captureFrame();
  if (result) {
    setPreviewFrame(result.dataUrl);
  }
};
```

The key changes:
- Add `crossOrigin="anonymous"` to prevent canvas "tainted" errors
- Add `onLoadedData` handler to capture initial frame when video first loads
- Add `preload="auto"` to ensure video data loads immediately
- Remove the `useEffect` that was trying to set `currentTime = 0` (not needed with `onLoadedData`)

---

## Issue 2: Premium Pricing Buttons

### Current State
The pricing type buttons (Free, One-Time Purchase, Subscription Only, Both) are plain buttons with no visual distinction or premium feel.

### Design Changes

**File: `src/pages/CreateProduct.tsx`** (lines ~695-740)

Transform the pricing buttons into a premium card-based selection with:
- Gradient backgrounds for selected state
- Icon indicators for each option
- Subtle glass effect containers
- Better visual hierarchy

```typescript
// Replace basic buttons with premium selection cards
<div className="grid grid-cols-2 gap-3">
  {/* Free Option */}
  <button
    type="button"
    onClick={() => { setPricingType("free"); setSelectedSubscriptionPlans([]); }}
    className={cn(
      "relative p-4 rounded-xl border-2 transition-all text-left",
      pricingType === "free"
        ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-green-500/5"
        : "border-border/50 hover:border-primary/30 bg-card/30"
    )}
  >
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        pricingType === "free" ? "bg-emerald-500/20" : "bg-muted"
      )}>
        <Gift className="w-5 h-5" />
      </div>
      <div>
        <span className="font-semibold">Free</span>
        <p className="text-xs text-muted-foreground">No charge</p>
      </div>
    </div>
    {pricingType === "free" && (
      <div className="absolute top-2 right-2">
        <Check className="w-4 h-4 text-emerald-500" />
      </div>
    )}
  </button>
  
  {/* One-Time Purchase Option */}
  {/* ... similar pattern with DollarSign icon */}
  
  {/* Subscription Only Option */}
  {/* ... similar pattern with Crown icon */}
  
  {/* Both Option */}
  {/* ... similar pattern with Sparkles icon */}
</div>
```

### Visual Specifications
- **Free**: Emerald/green gradient when selected
- **One-Time Purchase**: Blue gradient when selected  
- **Subscription Only**: Primary/purple gradient with Crown icon
- **Both**: Golden/amber gradient with Sparkles icon
- All cards: 2-column grid, rounded corners, subtle hover states
- Selected state: Checkmark in top-right corner

---

## Files to Modify

1. **`src/components/product/VideoFrameSelector.tsx`**
   - Add `crossOrigin="anonymous"` to video element
   - Add `onLoadedData` handler for initial frame capture
   - Add `preload="auto"` attribute
   - Improve loading state UX

2. **`src/pages/CreateProduct.tsx`**
   - Import additional icons (`Gift`, `DollarSign`)
   - Replace pricing type buttons (lines 695-738) with premium card grid
   - Add visual hierarchy with icons and descriptions

---

## Summary

| Issue | Fix |
|-------|-----|
| Frame selector shows "Loading preview..." forever | Add `onLoadedData` event + `crossOrigin` + `preload` |
| Pricing buttons look basic | Convert to 2x2 premium card grid with gradients and icons |
