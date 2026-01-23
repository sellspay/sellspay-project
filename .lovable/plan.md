

# Implementation Plan: Product Slug, World Map, and Tools Redesign

This plan addresses three key improvements: a custom slug system for products, a proper world map for the dashboard, and a complete redesign of the Tools page.

---

## 1. Product Slug Section in Create/Edit Product

### Current State
The `CreateProduct.tsx` and `EditProduct.tsx` pages create products without custom slugs. Products are accessed by their UUID (e.g., `/product/abc123-uuid`).

### Changes Required

**Database Migration:**
- Add a `slug` column to the `products` table (unique, nullable)

**UI Changes:**
- Add a "Slug" input field in the "Basic Information" card
- Display a preview of the URL (e.g., `editorsparadise.com/p/my-awesome-preset`)
- Auto-generate slug from title when left empty (using `slugify` logic: lowercase, replace spaces with hyphens, remove special characters)
- Validate for uniqueness before submission

**Files to Create/Modify:**
- Database migration for `slug` column
- `src/pages/CreateProduct.tsx` - Add slug input and auto-generation
- `src/pages/EditProduct.tsx` - Add slug editing capability
- `src/pages/ProductDetail.tsx` - Support slug-based routing
- `src/App.tsx` - Add route for `/p/:slug`

---

## 2. Dashboard Visits Map Improvement

### Current State
The `VisitsMap.tsx` component uses a crude hand-drawn SVG with basic polygon shapes for continents. It doesn't show actual country boundaries.

### Changes Required

**Approach:** Use an embedded SVG world map with proper country paths, coloring countries based on visit data.

**Implementation:**
- Create a proper world map component using GeoJSON-derived SVG paths
- Color countries based on their visit counts with a gradient scale
- Add proper country name labels and tooltips on hover
- Include a legend showing the color scale
- Keep the country list below the map for quick reference

**Files to Modify:**
- `src/components/dashboard/VisitsMap.tsx` - Complete rewrite with proper world map SVG

**Data Structure (already in place):**
```typescript
{ country: 'US', visits: 150 }
```

---

## 3. Tools Page Complete Redesign

### Current State
The Tools page shows a 6-card grid layout. Individual tool pages are separate routes (e.g., `/tools/audio-cutter`).

### Reference Design Analysis
Based on the reference images:
- Left sidebar with category tabs: "All", "Audio", "Generators"
- List of tools with: Title, description, badges ("Popular", "New")
- Selected tool's interface displays on the right side
- Clean, professional dark theme
- Tool content is inline (not a separate page)

### New Architecture

**Main Tools Page (`/tools`):**
- Two-column layout: sidebar (left) + content area (right)
- Category tabs at the top of sidebar
- Tool list items are clickable, highlight when active
- Selected tool's full interface renders on the right

**Tool Categories:**
1. **Audio** (existing tools):
   - Voice Isolator (to be added - Popular badge)
   - SFX Isolator (to be added)
   - Music Splitter (to be added - New badge)
   - Pitch Shifter (to be added)
   - Key/BPM Finder (to be added)
   - Cutter (Audio Cutter - existing)
   - Joiner (Audio Joiner - existing)
   - Recorder (Audio Recorder - existing)
   - Converter (Audio Converter - existing)
   - Video to Audio (existing)
   - Waveform Generator (existing)

2. **Generators** (new category):
   - Manga Generator (Popular badge)
   - Manhwa Generator
   - Shape Scene Generator

**Files to Create:**
- `src/components/tools/ToolsSidebar.tsx` - Sidebar with categories and tool list
- `src/components/tools/ToolContent.tsx` - Container for tool interface
- `src/components/tools/VoiceIsolator.tsx` - Placeholder for future AI tool
- `src/components/tools/MangaGenerator.tsx` - Placeholder for future AI generator

**Files to Modify:**
- `src/pages/Tools.tsx` - Complete rewrite with new layout
- `src/App.tsx` - Update routing (tools now use query params or embedded state, not separate routes)

### New Tools Page Structure

```text
+----------------------------------+----------------------------------------+
|  Tools                           |                                        |
|  Your hub for audio tools...     |                                        |
+----------------------------------+                                        |
|  All | Audio | Generators        |                                        |
+----------------------------------+                                        |
|  > Voice Isolator  [Popular]     |       [Selected Tool Icon]             |
|    Remove vocals or background   |                                        |
|                                  |       Tool Title                       |
|    SFX Isolator                  |       Tool description here...         |
|    Isolate sound effects...      |                                        |
|                                  |       [Browse my files]                |
|    Music Splitter  [New]         |                                        |
|    Split stems (vocals, drums)   |       ... tool interface ...           |
|                                  |                                        |
|    Cutter                        |                                        |
|    Trim and slice audio...       |                                        |
|                                  |                                        |
|    Joiner                        |                                        |
|    Merge multiple audio files    |                                        |
|                                  |                                        |
|    Recorder                      |                                        |
|    Record high-quality audio     |                                        |
+----------------------------------+----------------------------------------+
```

---

## Technical Details

### 1. Slug Generation Logic
```typescript
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens
    .substring(0, 100);       // Limit length
};
```

### 2. World Map Implementation
Using an inline SVG with proper country paths (ISO 3166-1 alpha-2 codes) that can be colored dynamically:
- Countries with visits get colored on a scale from light to dark primary color
- Countries without visits stay muted/gray
- Hover shows tooltip with country name and visit count

### 3. Tools State Management
The Tools page will use React state to track:
- `selectedCategory`: 'all' | 'audio' | 'generators'
- `selectedTool`: string (tool ID)

Each tool component will be imported and rendered conditionally based on selection.

---

## Implementation Order

1. **Database Migration** - Add slug column to products
2. **CreateProduct/EditProduct** - Add slug input UI
3. **VisitsMap** - Rebuild with proper world map
4. **Tools Page** - Create new components and redesign layout
5. **Route Updates** - Support slug-based product URLs

---

## Summary

| Feature | Scope | Complexity |
|---------|-------|------------|
| Product Slug | DB + 3 files | Medium |
| World Map | 1 component rewrite | Medium |
| Tools Redesign | New layout + 3-4 new components | High |

