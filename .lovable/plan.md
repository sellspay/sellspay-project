
# Dynamic Page Navigator & ChatInputBar UI Polish

## Overview

This plan addresses two issues:

1. **Page Navigator Sync** - The dropdown shows hardcoded pages (Home, Products, Contact) while the AI may generate different pages (Home, Products, Bundles, Support). We need to make it dynamic.

2. **ChatInputBar Scrollbar Polish** - Hide the ugly gray scrollbar while keeping scroll functionality, and ensure the textarea has proper padding.

---

## Part 1: Dynamic Page Navigator

### Problem Analysis

The current `PageNavigator.tsx` has a hardcoded `SITE_PAGES` array:
```typescript
const SITE_PAGES = [
  { id: "home", path: "/", label: "Home", icon: Layout },
  { id: "products", path: "/products", label: "Products", icon: ShoppingBag },
  { id: "contact", path: "/contact", label: "Contact", icon: Mail },
];
```

When the AI generates a site with different routes, this dropdown doesn't update.

### Solution: Accept Pages as a Prop

#### Step 1: Update PageNavigator to Accept Dynamic Pages

**File:** `src/components/ai-builder/PageNavigator.tsx`

- Remove the hardcoded `SITE_PAGES` constant
- Accept a `pages` prop with the shape `{ id: string; path: string; label: string }[]`
- Export the `SitePage` interface for reuse
- Update rendering to use the passed `pages` prop
- Change header text from "Site Pages" to "Detected Pages"

#### Step 2: Create Route Parser Utility

**File:** `src/utils/routeParser.ts` (NEW)

Create a utility function that parses generated code to extract route definitions:

```typescript
export interface SitePage {
  id: string;
  path: string;
  label: string;
}

export function parseRoutesFromCode(code: string): SitePage[] {
  const pages: SitePage[] = [{ id: 'home', path: '/', label: 'Home' }];
  
  // Regex to find Route path definitions
  const routeRegex = /<Route[^>]*path=["']([^"']+)["'][^>]*>/g;
  let match;
  
  const foundPaths = new Set<string>(['/']);
  
  while ((match = routeRegex.exec(code)) !== null) {
    const path = match[1];
    // Skip already found, dynamic routes (:id), and root
    if (!path || path === '/' || foundPaths.has(path) || path.includes(':')) continue;
    
    foundPaths.add(path);
    
    // Convert "/about-us" -> "About Us"
    const label = path
      .replace('/', '')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    pages.push({ id: path, path, label });
  }
  
  return pages;
}
```

#### Step 3: Wire Up in AIBuilderCanvas

**File:** `src/components/ai-builder/AIBuilderCanvas.tsx`

Add state and effect to parse routes from generated code:

```typescript
// Add state for detected pages
const [detectedPages, setDetectedPages] = useState<SitePage[]>([
  { id: 'home', path: '/', label: 'Home' }
]);

// Parse routes whenever code changes
useEffect(() => {
  if (code) {
    const pages = parseRoutesFromCode(code);
    setDetectedPages(pages);
  }
}, [code]);
```

#### Step 4: Update VibecoderHeader Props

**File:** `src/components/ai-builder/VibecoderHeader.tsx`

- Add `pages: SitePage[]` prop to interface
- Pass `pages` to the `PageNavigator` component

---

## Part 2: ChatInputBar Scrollbar Polish

### Problem Analysis

The textarea shows an ugly gray scrollbar when content exceeds 6 lines. While scrolling should remain functional, the visual scrollbar is distracting.

### Solution: CSS Hide Scrollbar + Improved Padding

**File:** `src/components/ai-builder/ChatInputBar.tsx`

#### Change 1: Add Scrollbar-Hiding CSS

Inject a `<style>` tag or use Tailwind utilities to hide scrollbars cross-browser:

```typescript
const hideScrollbarStyle = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
```

#### Change 2: Apply Class to Textarea

Update the textarea className to include `no-scrollbar`:

```typescript
className={cn(
  "flex-1 bg-transparent text-sm text-zinc-100 resize-none outline-none py-2 px-1",
  "min-h-[36px] max-h-[160px]",
  "no-scrollbar", // <-- Add this instead of scrollbar-thin classes
  "disabled:opacity-50 disabled:cursor-not-allowed",
  // ...rest
)}
```

#### Change 3: Improved Padding Right

Ensure text doesn't feel cramped near the edge by adding `pr-2` (8px padding right) to the textarea.

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/ai-builder/PageNavigator.tsx` | MODIFY | Accept `pages` prop instead of hardcoded list, export `SitePage` type |
| `src/utils/routeParser.ts` | CREATE | New utility to parse routes from generated TSX code |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | MODIFY | Add `detectedPages` state, parse routes on code change, pass to header |
| `src/components/ai-builder/VibecoderHeader.tsx` | MODIFY | Accept and forward `pages` prop to PageNavigator |
| `src/components/ai-builder/ChatInputBar.tsx` | MODIFY | Add `no-scrollbar` CSS, apply to textarea, improve padding |

---

## Expected Results

### Page Navigator
- Dropdown now shows pages detected from the AI-generated code
- "Bundles", "Support", or any custom route the AI generates will appear automatically
- Login/Auth pages are filtered out by the parser (routes with `:` are skipped)

### Chat Input Box
- Scrollbar is invisible but scrolling still works
- Text has proper padding and doesn't feel cramped
- Clean, premium look matching the rest of the UI
