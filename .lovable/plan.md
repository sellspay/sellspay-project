
# Fix Website Branding & Social Sharing Preview

## Problem
When sharing the EditorsParadise website link on social media or messaging apps, it currently shows:
- **Title**: "Lovable App"
- **Description**: "Lovable Generated Project"
- **Image**: Lovable's default OG image
- **Favicon**: Default Lovable favicon

## Solution

### 1. Update Meta Tags in `index.html`

Replace all Lovable branding with EditorsParadise branding:

| Current | New |
|---------|-----|
| `<title>Lovable App</title>` | `<title>EditorsParadise</title>` |
| `description: "Lovable Generated Project"` | `description: "The ultimate marketplace for editors. Discover premium Presets, LUTs, SFX, Templates, Overlays and Fonts crafted by professional creators worldwide."` |
| `og:title: "Lovable App"` | `og:title: "EditorsParadise"` |
| `author: "Lovable"` | `author: "EditorsParadise"` |
| `twitter:site: "@Lovable"` | `twitter:site: "@EditorsParadise"` |

### 2. Add EP Logo as Favicon

Copy the uploaded EP logo to the `public` folder as `favicon.png` and update the HTML to reference it. This will show the EP logo in browser tabs and when shared.

### 3. Create Social Share OG Image

For the landscape 1200x630 OG image (standard for social sharing), I'll need to create a dedicated image that showcases the hero section. Options:

**Option A (Recommended)**: Create a static OG image file that captures the essence of the hero section with:
- The cosmic purple background
- "Level Up Your Creative Workflow" headline
- EditorsParadise branding
- 1200x630 dimension (optimal for social platforms)

**Option B**: Use a screenshot of the hero section (but this requires an external image)

### 4. Files to Modify/Create

| File | Action |
|------|--------|
| `index.html` | Update all meta tags with EP branding |
| `public/favicon.png` | Copy EP logo as new favicon |
| `public/og-image.png` | Create/add landscape social sharing image |

---

## Technical Details

### Updated `index.html` Structure
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <title>EditorsParadise</title>
    <meta name="description" content="The ultimate marketplace for editors. Discover premium Presets, LUTs, SFX, Templates, Overlays and Fonts crafted by professional creators worldwide." />
    <meta name="author" content="EditorsParadise" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/favicon.png" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="EditorsParadise" />
    <meta property="og:description" content="The ultimate marketplace for editors. Discover premium Presets, LUTs, SFX, Templates, Overlays and Fonts crafted by professional creators worldwide." />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://editorsparadise.lovable.app/og-image.png" />
    <meta property="og:url" content="https://editorsparadise.lovable.app" />
    <meta property="og:site_name" content="EditorsParadise" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@EditorsParadise" />
    <meta name="twitter:title" content="EditorsParadise" />
    <meta name="twitter:description" content="The ultimate marketplace for editors. Discover premium Presets, LUTs, SFX, Templates, Overlays and Fonts crafted by professional creators worldwide." />
    <meta name="twitter:image" content="https://editorsparadise.lovable.app/og-image.png" />
  </head>
  ...
</html>
```

### OG Image Requirements
For the best social sharing experience, I'll create a proper OG image with:
- **Dimensions**: 1200x630 pixels (1.91:1 aspect ratio - standard for Facebook/Twitter/LinkedIn)
- **Content**: Hero section aesthetic with cosmic background, headline, and EP branding
- **Location**: `public/og-image.png`

### Favicon
The EP logo will be copied to `public/favicon.png` and referenced with a proper link tag.

---

## Implementation Steps

1. **Copy EP logo** to `public/favicon.png`
2. **Generate OG image** - Create a 1200x630 landscape image capturing the hero aesthetic using AI image generation
3. **Update `index.html`** with all new meta tags, favicon reference, and OG image URLs

This will ensure when anyone shares editorsparadise.lovable.app, they'll see:
- ✅ "EditorsParadise" as the title
- ✅ Proper brand description
- ✅ EP logo as the icon
- ✅ Beautiful hero-style landscape preview image
