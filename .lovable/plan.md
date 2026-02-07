
# Products Tab for AI Builder

## Summary
Add a dedicated **Products** tab to the AI Builder header (alongside Preview/Code/Image/Video) that displays the seller's existing products and allows them to create new ones without leaving the editor. The AI will only use real products from the database when generating storefronts—never fake placeholder products.

---

## Problem Being Solved

1. **No product visibility in editor**: Sellers can't see their existing products while designing their storefront
2. **Context disconnect**: When AI generates a "products page," it uses placeholder data instead of real products
3. **Workflow friction**: Sellers must exit the editor, create products separately, then return

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         VibecoderHeader                             │
│  ┌─────────┬───────┬────────┬────────┬──────────┐                   │
│  │ Preview │ Code  │ Image  │ Video  │ Products │  ← NEW TAB        │
│  └─────────┴───────┴────────┴────────┴──────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────────┐
         │          ProductsPanel (new)            │
         │  ┌─────────────────────────────────┐    │
         │  │  Your Products (grid/list)      │    │
         │  │  - Cover, Title, Price, Status  │    │
         │  │  - Click to view/edit           │    │
         │  └─────────────────────────────────┘    │
         │  ┌─────────────────────────────────┐    │
         │  │  Empty State: "No products yet" │    │
         │  │  [+ Create Product] button      │    │
         │  └─────────────────────────────────┘    │
         └─────────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────────┐
         │    CreateProductDialog (new modal)      │
         │    Reuses logic from CreateProduct.tsx  │
         │    - Form fields, file upload, pricing  │
         │    - Submits to Supabase products table │
         └─────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Extend ViewMode Type
Update `src/components/ai-builder/types/generation.ts` to add the new view mode:

```typescript
export type ViewMode = 'preview' | 'code' | 'image' | 'video' | 'products';
```

### Step 2: Update VibecoderHeader
Modify `src/components/ai-builder/VibecoderHeader.tsx`:
- Add a new **Products** tab button after the Image/Video group (with a divider)
- Use the `Package` icon from lucide-react
- Style with a green accent color (`bg-emerald-600`) when active

### Step 3: Create ProductsPanel Component
Create `src/components/ai-builder/ProductsPanel.tsx`:
- Fetch products from Supabase where `creator_id` matches the current user's profile ID
- Display as a responsive grid with:
  - Cover image thumbnail
  - Product name
  - Price badge (or "Free" indicator)
  - Status pill (draft/published)
- Empty state with illustration and CTA to create first product
- "Create Product" button in header triggers the dialog

### Step 4: Create CreateProductDialog Component
Create `src/components/ai-builder/CreateProductDialog.tsx`:
- Extract core form logic from `src/pages/CreateProduct.tsx` into a reusable dialog
- Opens as a sheet/drawer overlay (not a full page)
- Supports all fields: name, description, type, pricing, cover image, attachments
- On successful creation, refresh the products list and close dialog
- Show toast notification on success

### Step 5: Wire Up in AIBuilderCanvas
Update `src/components/ai-builder/AIBuilderCanvas.tsx`:
- Add `viewMode === 'products'` conditional to render `ProductsPanel`
- Pass `profileId` to ProductsPanel for fetching products
- Add state for products list with refresh capability
- Pass `onCreateProduct` and `onProductCreated` callbacks

### Step 6: Inject Products Context to AI
Update `supabase/functions/vibecoder-v2/index.ts`:
- Accept optional `productsContext` in the request body
- If provided, inject a condensed products summary into the system prompt
- Format: `CREATOR_PRODUCTS: [{ id, name, price, type, cover_url }]`

Update `src/components/ai-builder/useStreamingCode.ts`:
- Fetch creator's products before making the AI request
- Pass condensed product data to the edge function
- AI will use real product data instead of generating fake placeholders

---

## Technical Details

### Products Query
```sql
SELECT id, name, price_cents, currency, cover_image_url, product_type, status
FROM products
WHERE creator_id = :profileId
ORDER BY created_at DESC
```

### AI Context Injection Format
```
CREATOR_PRODUCTS:
[
  { "id": "abc", "name": "Premium LUT Pack", "price": "$29", "type": "lut", "image": "https://..." },
  { "id": "def", "name": "Anime Overlays", "price": "Free", "type": "overlay", "image": "https://..." }
]

When the user asks to show products, use ONLY these real products. Never generate fake placeholder products.
```

### Key Policies
- **UI-Only Products Tab**: The tab shows existing products and triggers the create flow
- **Real Products Only**: AI prompt injection ensures it uses actual creator products
- **No Prompt-Based Creation**: Users cannot say "create a product called X"—they must use the form
- **Seamless Integration**: Dialog overlays the editor, no page navigation required

---

## New Files
1. `src/components/ai-builder/ProductsPanel.tsx` - Grid view of products
2. `src/components/ai-builder/CreateProductDialog.tsx` - Modal form for new products

## Modified Files
1. `src/components/ai-builder/types/generation.ts` - Add 'products' to ViewMode
2. `src/components/ai-builder/VibecoderHeader.tsx` - Add Products tab button
3. `src/components/ai-builder/AIBuilderCanvas.tsx` - Render ProductsPanel when active
4. `src/components/ai-builder/useStreamingCode.ts` - Fetch and inject products context
5. `supabase/functions/vibecoder-v2/index.ts` - Accept and use products context in prompt

---

## User Experience Flow

1. User opens AI Builder and sees the new **Products** tab in the header
2. Clicking it reveals a grid of their existing products (or empty state)
3. Empty state shows: "No products yet. Create your first product to display it in your storefront."
4. Clicking "Create Product" opens a drawer/sheet with the full product form
5. After creating, the products list refreshes and shows the new product
6. When user prompts AI: "Create a products page," AI uses their real product data
7. The generated storefront displays their actual products with correct names/prices/images
