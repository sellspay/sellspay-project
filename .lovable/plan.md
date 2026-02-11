

# Wiring Integration + Missing Components

## What This Plan Covers

All remaining gaps from the original vision that can be built now:

1. Wire SourceSelector, BrandKitToggle, CreditEstimator, and AssetOutputPanel into ToolActiveView
2. Build ProductContextCard (compact preview with "Edit context" after product selection)
3. Add multi-product selection support to SourceSelector for bundle tools
4. Add "Enhance" vs "Regenerate" mode toggle for image tools
5. Add "Product-to-Promo" vs "Generate with reference" mode toggle for video tools
6. Wire post-gen actions (set as thumbnail, add to gallery) with real database calls
7. Auto-link generated assets to products
8. Frame prompt pre-population from product data

---

## Technical Details

### 1. Modify `ToolActiveView.tsx` -- Wire in all 4 standalone components

Add state for source mode, selected product(s), brand kit toggle, and post-generation output. Insert SourceSelector + BrandKitToggle + CreditEstimator above the tool component, and AssetOutputPanel below it after generation completes. Pass product context and brand kit data down to tool components.

```text
+---------------------------------------------+
| Hero Banner (existing)                      |
|---------------------------------------------|
| Source: [Blank] [Use Product]               |
| [ProductContextCard if product selected]    |
| [BrandKit toggle]   [CreditEstimator]       |
|---------------------------------------------|
| Tool Component (existing lazy-loaded page)  |
|---------------------------------------------|
| AssetOutputPanel (shown after generation)   |
+---------------------------------------------+
```

Key state additions:
- `sourceMode: "blank" | "product"`
- `selectedProducts: ProductContext[]`
- `brandKitEnabled: boolean`
- `brandKitData: BrandKitData | null`
- `generatedAsset: { type, storageUrl, filename } | null`

The tool's credit cost comes from `toolsRegistry` lookup by toolId.

### 2. New component: `ProductContextCard.tsx`

Compact card shown after product selection with:
- Product image thumbnail, name, tags, price
- "Edit context" button that opens an inline editable textarea for description override
- "Remove" button to clear selection
- For multi-product mode: shows stacked cards with "Add another" button

### 3. Modify `SourceSelector.tsx` -- Multi-product support

Add an optional `multiSelect` prop. When true:
- Product picker allows selecting multiple products (checkboxes)
- Returns `ProductContext[]` instead of single product
- Shows count badge "3 products selected"

Bundle-related tools (`upsell-suggestions`, `generate-bundles`) will pass `multiSelect={true}`.

### 4. New component: `ImageToolModeToggle.tsx`

For image tools (thumbnail-generator, background-remover, image-upscaler), shows:
- "Enhance" mode: upscale, sharpen, color correction, "make it more premium"
- "Regenerate" mode: AI describes current image, user edits description, regenerates with brand kit colors
- "Keep product recognizable" checkbox
- "Variations: 1-4" slider

### 5. New component: `VideoToolModeToggle.tsx`

For video tools, shows:
- "Product-to-Promo" mode: auto-generates script + captions + hashtags from product data
  - Duration picker (6/10/15/30/60s)
  - Aspect ratio (9:16 default)
  - Style presets (Cinematic / UGC / Tutorial / Hype / Minimal)
  - Voiceover toggle + voice select
- "Generate with reference" mode: uses product context but doesn't force promo format

### 6. Wire post-gen actions in `AssetOutputPanel.tsx`

Make the buttons functional:
- **Set as Thumbnail**: Updates `products.cover_image_url` for the linked product
- **Add to Gallery**: Inserts into `product_gallery` or product media array
- **Download**: Already works
- **Generate More**: Callback to re-run the tool
- **Generate Social Posts**: Navigates to social-posts-pack tool with product pre-selected

### 7. Asset-to-product linking

When a tool generates output with a product selected:
- Automatically set `tool_assets.product_id` to the selected product
- Set `tool_assets.used_on_page` when "Set as Thumbnail" or "Add to Gallery" is clicked
- Insert a row in `tool_assets` after every generation

### 8. Frame prompt pre-population

When "Use Product" is active, auto-fill prompt/frame suggestions:
- Frame 1: Product name + hook
- Frame 2: Key benefit bullets
- Frame 3: What's included + social proof
- Frame 4: CTA + store URL

Implemented as a utility function `buildProductFramePrompts(product: ProductContext): string[]` that tools can optionally consume.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/tools/ProductContextCard.tsx` | Compact product preview with edit context |
| `src/components/tools/ImageToolModeToggle.tsx` | Enhance vs Regenerate toggle for image tools |
| `src/components/tools/VideoToolModeToggle.tsx` | Product-to-Promo vs Reference toggle for video tools |
| `src/components/tools/productFramePrompts.ts` | Utility to generate frame prompts from product data |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/tools/ToolActiveView.tsx` | Add SourceSelector, BrandKitToggle, CreditEstimator, AssetOutputPanel, ProductContextCard; manage state for product context, brand kit, generated asset |
| `src/components/tools/SourceSelector.tsx` | Add `multiSelect` prop, checkbox-based multi-product selection, return array |
| `src/components/tools/AssetOutputPanel.tsx` | Wire real callbacks for set-thumbnail, add-to-gallery, navigate-to-social-posts |
| `src/components/tools/toolsRegistry.ts` | Add `supportsModes` and `supportsMultiProduct` flags to relevant entries |

