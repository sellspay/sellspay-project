
# Profile Editor ("Launch Editor") Complete Redesign

This plan implements a professional website-builder style profile editor similar to the reference images from Ko-fi/Gumroad, with a live preview showing the actual profile and full section customization capabilities.

---

## Current State Analysis

The current profile editor has:
- A fullscreen dialog with a left sidebar for section management
- Basic section types (text, image, gallery, video, collection, about_me, headline, divider)
- No live preview of the actual profile - just section previews in isolation
- No style presets for sections
- Limited section editing options (no background, color scheme, or format tabs)

---

## Requirements Summary

1. **Live Profile Preview** - Right side shows the actual profile with background, banner, avatar, and editable lower section
2. **Non-editable Top Half** - Banner, avatar, bio, and social links are read-only in the editor (managed via Settings)
3. **Editable Lower Section** - Everything below the header (collections area) is fully customizable
4. **Style Presets** - Each section type has multiple visual style presets to choose from
5. **Section Editor with Tabs** - Format, Background, and Color Scheme tabs for each section
6. **Section-specific Backgrounds** - Each section can have its own background image with overlay opacity
7. **Additional Section Types** - Add new types: Testimonials, FAQs, Newsletter, Slideshow, Basic List, Slider List, Featured Product, Logo List, Contact Us, Collage
8. **Live Updates** - Changes appear immediately in the preview

---

## Architecture

```text
+----------------------------------------------------------+
| Profile Editor                              [Save] [Close]|
+----------------------------------------------------------+
|        |                                                  |
| PAGE   | +----------------------------------------------+ |
| NAVBAR | |  FIXED TOP HALF (Read-only)                  | |
|        | |  - Background image                           | |
|  Home  | |  - Banner                                     | |
|  Page  | |  - Avatar, Name, Bio, Social Links           | |
|        | |  - Tabs                                       | |
| +----- | +----------------------------------------------+ |
|        |                                                  |
| SECTIONS| +----------------------------------------------+ |
| LIST   | |  EDITABLE LOWER SECTION                       | |
|        | |  - Custom sections with live preview          | |
|  Header| |  - Drag sections to reorder                   | |
|  About | |  - Click to select for editing                | |
|  Text  | |  - Highlight currently selected section       | |
| Collect| |                                               | |
| Headlin| |                                               | |
|        | +----------------------------------------------+ |
| +Add   |                                                  |
+--------+--------------------------------------------------+
         |
         v
+------------------+
| SECTION EDITOR   |  (slides in from left when section selected)
| [Format] [BG] [Color]
|                  |
| Section-specific |
| options...       |
|                  |
| [Delete Section] |
+------------------+
```

---

## Implementation Steps

### Step 1: Extend Section Types

**File: `src/components/profile-editor/types.ts`**

Add new section types and content interfaces:
- `testimonials` - Customer testimonials with avatar, name, quote
- `faq` - Expandable FAQ items
- `newsletter` - Email signup form with background options
- `slideshow` - Auto-rotating image carousel
- `basic_list` - Simple bulleted or numbered list
- `slider_list` - Horizontal scrolling content list
- `featured_product` - Highlight a single product
- `logo_list` - Row of partner/client logos
- `contact_us` - Contact form or info block
- `collage` - Multi-image artistic layout

Add `style_preset` and `background` fields to the `SectionContent` base:
```typescript
interface SectionStyleOptions {
  preset?: string;           // e.g., 'style1', 'style2', 'style3'
  backgroundColor?: string;   // solid color
  backgroundImage?: string;   // image URL
  backgroundOverlay?: number; // 0-100 opacity
  backgroundWidth?: 'contained' | 'full';
  colorScheme?: 'white' | 'light' | 'dark' | 'black' | 'highlight';
  sectionHeight?: 'small' | 'medium' | 'large';
}
```

### Step 2: Update Database Schema

**Database Migration:**

Add columns to `profile_sections` table:
- `style_options JSONB DEFAULT '{}'` - Store style preset, background, color scheme

### Step 3: Create Live Profile Preview Component

**File: `src/components/profile-editor/LiveProfilePreview.tsx`**

This component renders the actual profile layout:
- Fixed header section (non-editable, grayed out with overlay)
  - Background image from profile
  - Banner
  - Avatar, username, name, bio
  - Social links
  - Tab bar
- Editable content area
  - Renders all sections in order
  - Highlights the currently selected section
  - Shows add-section dropzone between sections
  - Click section to select for editing

Props:
```typescript
interface LiveProfilePreviewProps {
  profile: Profile;
  sections: ProfileSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onReorderSections: (newOrder: ProfileSection[]) => void;
}
```

### Step 4: Create Enhanced Section Editor with Tabs

**File: `src/components/profile-editor/SectionEditorPanel.tsx`**

Redesigned editor panel with three tabs (like the reference images):

**Format Tab:**
- Section-specific content editing (title, body, images, etc.)
- Section height selector (Small, Medium, Large)
- Layout options specific to section type

**Background Tab:**
- Image upload with preview thumbnail
- Replace / Remove buttons
- Overlay opacity slider (0-100%)
- Background width toggle (Full Width vs Contained)

**Color Scheme Tab:**
- Preset color schemes: White, Light, Dark, Black, Highlight
- Each shows "Aa" preview of the scheme
- "Edit" button for Light scheme (custom colors)

### Step 5: Create Style Presets Panel

**File: `src/components/profile-editor/StylePresetsPanel.tsx`**

When adding a new section or changing presets:
- Left sidebar shows section type list (like reference image)
- Right side shows 2-3 visual preset cards for selected type
- Each preset is a thumbnail preview with a number badge
- Click preset to apply that style

Categories:
- Content: Text, Headline, About Me, Basic List
- Media: Image, Image With Text, Gallery, Slideshow, Video
- Products: Featured Product, Collection, Featured Collection List
- Social Proof: Testimonials, Logo List
- Engagement: Newsletter, Contact Us, FAQs
- Layout: Divider, Collage

### Step 6: Create Page Navigation Dropdown

**File: `src/components/profile-editor/PageSelector.tsx`**

Dropdown to switch between editing different pages:
- Home Page (main profile)
- Collection Pages (one per collection)
- Product Pages (optional)
- Custom Pages (future)

Header bar with:
- Hamburger menu icon
- "Collection Page" dropdown with page selector
- "+ Add" button for new sections

### Step 7: Redesign Main Editor Layout

**File: `src/components/profile-editor/ProfileEditorDialog.tsx`**

Complete layout redesign:

```text
+------------------------------------------------------------------+
| [Menu] | Collection Page v |  + Add  |     Preview  | Publish   |
+------------------------------------------------------------------+
| HOME PAGE              |                                          |
| All Products           |   +----------------------------------+   |
| +-----------------+    |   |  PROFILE HEADER (read-only)      |   |
| | Header          |    |   |  Background, Banner, Avatar...  |   |
| | About Me        |    |   +----------------------------------+   |
| | welcome text    |    |   |                                  |   |
| | Text            |    |   |  [Header Section]                |   |
| | Collection      |    |   |                                  |   |
| | Headline        |    |   |  [About Me Section]              |   |
| | + Add section   |    |   |                                  |   |
| +-----------------+    |   |  [Text Section] <-- SELECTED     |   |
|                        |   |  (highlighted border)            |   |
| EDITING SINGLE PAGE    |   |                                  |   |
| "All Products"         |   |  [Collection Section]            |   |
|                        |   |                                  |   |
| STORE STYLE            |   |  [Headline Section]              |   |
| Change store style ->  |   |                                  |   |
+------------------------+   +----------------------------------+   |
                         |                                          |
                         |  <- Section Editor Panel (when editing)  |
+------------------------------------------------------------------+
```

### Step 8: Create Section-Specific Preview Components

**File: `src/components/profile-editor/previews/*.tsx`**

Enhanced preview components that respect style options:
- Apply background image with overlay
- Apply color scheme classes
- Apply section height
- Show preset-specific layouts

Examples:
- `TestimonialsPreview.tsx` - Grid of testimonial cards with avatars
- `FAQPreview.tsx` - Accordion-style expandable items
- `NewsletterPreview.tsx` - Email input with background image
- `LogoListPreview.tsx` - Horizontal row of logos

### Step 9: Create Section Editor Forms

Update `src/components/profile-editor/SectionEditor.tsx`:

Add editors for new section types:
- `TestimonialsEditor` - Add/edit testimonial items (avatar, name, role, quote)
- `FAQEditor` - Add/edit Q&A pairs
- `NewsletterEditor` - Title, subtitle, button text, placeholder
- `SlideshowEditor` - Manage slides with images and captions
- `LogoListEditor` - Upload multiple logo images
- `FeaturedProductEditor` - Select a product to feature

### Step 10: Implement Store Style Settings

**File: `src/components/profile-editor/StoreStylePanel.tsx`**

Global style settings:
- Primary color picker
- Font family selection (if applicable)
- Default section spacing
- Border radius preference

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/profile-editor/LiveProfilePreview.tsx` | Real-time profile preview with editable sections |
| `src/components/profile-editor/SectionEditorPanel.tsx` | Tabbed editor with Format/Background/Color |
| `src/components/profile-editor/StylePresetsPanel.tsx` | Visual preset selection grid |
| `src/components/profile-editor/PageSelector.tsx` | Page navigation dropdown |
| `src/components/profile-editor/StoreStylePanel.tsx` | Global store style settings |
| `src/components/profile-editor/previews/TestimonialsPreview.tsx` | Testimonials section preview |
| `src/components/profile-editor/previews/FAQPreview.tsx` | FAQ section preview |
| `src/components/profile-editor/previews/NewsletterPreview.tsx` | Newsletter section preview |
| `src/components/profile-editor/previews/SlideshowPreview.tsx` | Slideshow section preview |
| `src/components/profile-editor/previews/LogoListPreview.tsx` | Logo list section preview |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile-editor/types.ts` | Add new section types, style options interface |
| `src/components/profile-editor/ProfileEditorDialog.tsx` | Complete layout redesign with live preview |
| `src/components/profile-editor/AddSectionPanel.tsx` | Add preset selection grid |
| `src/components/profile-editor/SectionEditor.tsx` | Add tabbed interface, new section editors |
| `src/components/profile-editor/SectionPreview.tsx` | Apply style options to previews |
| `src/components/profile-editor/SectionList.tsx` | Update styling to match reference |

## Database Migration

Add `style_options` column to `profile_sections` table for storing background, color scheme, and preset configuration.

---

## User Experience Flow

1. Creator clicks "Launch Editor" on their profile
2. Full-screen editor opens showing their profile exactly as visitors see it
3. Top section (banner, avatar, bio) is visible but clearly marked as non-editable
4. Below the header, all custom sections are shown
5. Clicking a section highlights it and opens the editor panel on the left
6. Editor panel has three tabs: Format, Background, Color Scheme
7. Changes appear instantly in the preview on the right
8. "+ Add section" opens the preset selection panel
9. User selects a section type and sees multiple style presets
10. Clicking a preset adds that section with the chosen style
11. Drag sections in the left sidebar to reorder
12. Click "Save Changes" to persist, "Publish" to make live

---

## Technical Considerations

### Live Preview Performance
- Use React.memo for preview components
- Debounce content updates
- Only re-render affected sections on change

### Style Options Storage
- Style options stored as JSONB in `style_options` column
- Merged with content when rendering
- Backwards compatible with existing sections (empty style_options = default)

### Background Image Handling
- Reuse existing Supabase storage upload logic
- Store in `product-media/profile-sections/{section_id}/`
- Apply as CSS background-image with overlay

---

## Summary

| Component | Status | Complexity |
|-----------|--------|------------|
| Live Profile Preview | New | High |
| Tabbed Section Editor | New | Medium |
| Style Presets Panel | New | Medium |
| New Section Types | New | Medium |
| Page Selector | New | Low |
| Store Style Panel | New | Low |
| Database Migration | New | Low |

This redesign transforms the profile editor from a basic section manager into a professional website builder, matching the polish and functionality of established platforms like Ko-fi, while maintaining the unique features of your creator marketplace.
