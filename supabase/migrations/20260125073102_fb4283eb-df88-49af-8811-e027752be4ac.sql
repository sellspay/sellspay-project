-- Continue security fixes (verification_codes already dropped)

-- Fix public_identities_cache - restrict to authenticated only
DROP POLICY IF EXISTS "Public read access for identity cache" ON public.public_identities_cache;
DROP POLICY IF EXISTS "Anyone can read identity cache" ON public.public_identities_cache;
DROP POLICY IF EXISTS "Authenticated users can read identity cache" ON public.public_identities_cache;

ALTER TABLE public.public_identities_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read identity cache"
ON public.public_identities_cache
FOR SELECT
TO authenticated
USING (true);

-- Recreate public_products view to ensure no email exposure
DROP VIEW IF EXISTS public.public_products;
CREATE VIEW public.public_products AS
SELECT 
  id,
  name,
  description,
  price_cents,
  currency,
  cover_image_url,
  preview_video_url,
  youtube_url,
  product_type,
  pricing_type,
  status,
  featured,
  slug,
  tags,
  subscription_access,
  creator_id,
  created_at,
  updated_at
FROM public.products
WHERE status = 'published';

GRANT SELECT ON public.public_products TO anon, authenticated;