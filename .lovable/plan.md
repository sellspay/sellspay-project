
# Fix Plan: Seller Button + Share Links

## Overview
Two critical issues to fix:
1. **Seller Button Broken**: Database trigger references a deleted table, causing all seller account switches to fail
2. **Wrong Share Links**: Sharing uses Lovable URLs instead of your custom domain with proper slugs

---

## Issue 1: Seller Button Not Working

### Root Cause
When you click "Yes, become a seller", the PATCH request to update `is_seller = true` fails with:

```
relation "public.seller_payment_config" does not exist
```

This happens because:
1. A trigger `ensure_seller_payment_config_trigger` was created to auto-create payment config when users become sellers
2. The trigger inserts into `public.seller_payment_config` 
3. A later migration **dropped** that table and moved data to `private.seller_config`
4. But the **trigger was never updated** - it still references the deleted table!

### Solution
Create a database migration to:
1. Drop the broken trigger
2. Update the function to insert into `private.seller_config` instead
3. Recreate the trigger

```sql
-- Drop the broken trigger that references deleted table
DROP TRIGGER IF EXISTS ensure_seller_payment_config_trigger ON public.profiles;

-- Replace the function to use the correct private schema table
CREATE OR REPLACE FUNCTION public.ensure_seller_payment_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When is_seller becomes true, ensure payment config exists
  IF NEW.is_seller = true AND (OLD.is_seller IS NULL OR OLD.is_seller = false) THEN
    INSERT INTO private.seller_config (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger with the fixed function
CREATE TRIGGER ensure_seller_payment_config_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_seller_payment_config();
```

---

## Issue 2: Wrong Share Links

### Current Behavior

**Product share:**
```
https://editorsparadise.lovable.app/product/abc-123
```

**Profile copy link:**
```
https://editorsparadise.lovable.app/@vzualz
```

### Expected Behavior

**Product share:**
```
https://editorsparadise.org/p/my-cool-preset
```
(Uses slug if available, falls back to ID)

**Profile copy link:**
```
https://editorsparadise.org/@vzualz
```

### Solution

#### Step 1: Add Production Domain Constant
Add to `src/lib/utils.ts`:
```tsx
export const PRODUCTION_DOMAIN = "https://editorsparadise.org";
```

#### Step 2: Update ProductDetail.tsx
- Add `slug` field to the Product interface
- Include `slug` in the product fetch query
- Update `handleShare` to build URL with custom domain + slug

```tsx
// Updated interface
interface Product {
  id: string;
  slug: string | null;  // Add this
  name: string;
  // ... rest
}

// Updated handleShare
const handleShare = async () => {
  const productPath = product?.slug 
    ? `/p/${product.slug}` 
    : `/product/${product?.id}`;
  const shareUrl = `${PRODUCTION_DOMAIN}${productPath}`;
  
  try {
    await navigator.share({
      title: product?.name,
      text: product?.description || "",
      url: shareUrl,
    });
  } catch {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  }
};
```

#### Step 3: Update Profile.tsx
```tsx
import { PRODUCTION_DOMAIN } from "@/lib/utils";

const copyProfileLink = () => {
  const url = `${PRODUCTION_DOMAIN}/@${profile?.username}`;
  navigator.clipboard.writeText(url);
  toast.success('Profile link copied!');
};
```

---

## Files to Modify

| File | Change |
|------|--------|
| Database Migration | Fix trigger to use `private.seller_config` |
| `src/lib/utils.ts` | Add `PRODUCTION_DOMAIN` constant |
| `src/pages/ProductDetail.tsx` | Add slug to interface, update share URL logic |
| `src/pages/Profile.tsx` | Update copy link to use production domain |

---

## Expected Results

After implementation:
1. **Seller button works** - Users can successfully switch to seller accounts, unlocking:
   - Create Product button
   - Dashboard access
   - Payout settings
   - All seller features

2. **Correct share links** - All shared links use your custom domain:
   - Products: `https://editorsparadise.org/p/[slug]`
   - Profiles: `https://editorsparadise.org/@[username]`
