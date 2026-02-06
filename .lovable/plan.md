
# Implementation Plan: Nuclear CSS Fix for Sandpack Height Collapse

## Problem

The Sandpack preview is collapsing to a tiny area because height inheritance is being blocked by internal Sandpack wrapper divs. The current approach using inline `style` props and Tailwind classes doesn't reach the internal elements that Sandpack generates.

**The Broken Chain:**
```text
<div h-full>                     ✅ Gets height
  <SandpackProvider>             ⚠️  Creates .sp-wrapper (height: auto by default)
    <div.sp-layout>              ⚠️  (height: auto)
      <div.sp-stack>             ⚠️  (height: auto)
        <div.sp-preview-container> ⚠️  (height: auto)
          <iframe>               ❌ Collapses to content size
```

## Solution

Inject a global `<style>` tag inside the `VibecoderPreview` component that uses `!important` rules to force all Sandpack internal wrappers to be 100% height. This bypasses React's style props entirely and targets the actual DOM elements Sandpack generates.

---

## File Changes

### File: `src/components/ai-builder/VibecoderPreview.tsx`

**Changes:**

1. **Add a `SANDPACK_HEIGHT_FIX` constant** containing the CSS override rules
2. **Inject the styles** at the top of the component's return using a `<style>` tag
3. **Simplify the wrapper divs** - remove redundant inline height styles since the global CSS handles it
4. **Add `min-height: 0`** rule to fix flexbox scroll behavior (critical for preventing the "tiny scrollbar" issue)

**The Nuclear CSS Rules:**

```css
/* Force ALL Sandpack internal wrappers to fill height */
.sp-wrapper, 
.sp-layout, 
.sp-stack { 
  height: 100% !important; 
  width: 100% !important; 
  display: flex !important; 
  flex-direction: column !important; 
  background: transparent !important;
}

/* Preview container needs flex-1 to consume space */
.sp-preview-container {
  flex: 1 !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

/* The iframe itself */
.sp-preview-iframe {
  flex: 1 !important;
  height: 100% !important;
  min-height: 0 !important;  /* Critical for flexbox scroll */
}

/* Code editor also needs full height */
.sp-code-editor {
  flex: 1 !important;
  height: 100% !important;
}
.cm-editor {
  height: 100% !important;
}
```

**Why `min-height: 0` is critical:**

In flexbox, children have a default `min-height: auto` which prevents them from shrinking below their content size. By setting `min-height: 0` on the iframe, we allow it to shrink/grow correctly within the flex container, enabling proper scrolling behavior.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/ai-builder/VibecoderPreview.tsx` | Add global `<style>` tag with nuclear CSS overrides for Sandpack internals |

---

## Expected Result

After this fix:
- The preview iframe will fill the entire left panel below the toolbar
- The code editor (when in code view) will also fill the panel
- No more "tiny preview" or "tiny scrollbar" issues
- The loading overlay will correctly cover the full preview area
