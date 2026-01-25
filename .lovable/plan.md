
# Fix Social Media Link Preview (Open Graph)

## Problem Identified
When sharing your website link, the social preview shows:
- **Title**: "Lovable App" (should be "EditorsParadise")
- **Description**: "Lovable Generated Project" (should describe the marketplace)
- **Image**: Shows a tall/stretched preview instead of the proper landscape OG image

## Root Cause
The Open Graph URLs in `index.html` are pointing to `https://editorsparadise.lovable.app/` but your custom domain is `https://editorsparadise.org/`. Social media crawlers may be getting confused by this mismatch or serving cached outdated content.

## Solution

### 1. Update index.html Meta Tags
Update all Open Graph and Twitter Card URLs to use your custom domain:

```text
File: index.html

Changes:
- og:image: https://editorsparadise.lovable.app/og-image.png -> https://editorsparadise.org/og-image.png
- og:url: https://editorsparadise.lovable.app -> https://editorsparadise.org
- twitter:image: https://editorsparadise.lovable.app/og-image.png -> https://editorsparadise.org/og-image.png
```

### 2. Add Additional OG Properties
Add width/height hints for the OG image to ensure platforms display it at the correct aspect ratio (1200x630 is the standard OG image size):

```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

---

## Technical Details

### Files to Modify
- `index.html` - Update meta tag URLs and add image dimension hints

### Updated Meta Tags
```html
<!-- Open Graph -->
<meta property="og:title" content="EditorsParadise" />
<meta property="og:description" content="The ultimate marketplace for editors. Discover premium Presets, LUTs, SFX, Templates, Overlays and Fonts crafted by professional creators worldwide." />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://editorsparadise.org/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://editorsparadise.org" />
<meta property="og:site_name" content="EditorsParadise" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@EditorsParadise" />
<meta name="twitter:title" content="EditorsParadise" />
<meta name="twitter:description" content="The ultimate marketplace for editors. Discover premium Presets, LUTs, SFX, Templates, Overlays and Fonts crafted by professional creators worldwide." />
<meta name="twitter:image" content="https://editorsparadise.org/og-image.png" />
```

---

## Post-Implementation Steps
After publishing, you'll need to clear cached previews:

1. **Discord**: Paste the link again - Discord auto-refreshes after some time, or try adding a query param like `?v=2`
2. **Facebook**: Use the [Sharing Debugger](https://developers.facebook.com/tools/debug/) to scrape the fresh metadata
3. **Twitter**: Use the [Card Validator](https://cards-dev.twitter.com/validator) to refresh
4. **LinkedIn**: Use the [Post Inspector](https://www.linkedin.com/post-inspector/)

These tools force the platforms to re-crawl your page and fetch the updated metadata.
