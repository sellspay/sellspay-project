-- CRITICAL FIX: Remove download_url from public_products view
-- This prevents free access to paid digital content
-- Downloads should only be accessed via the secure get-download-url edge function

DROP VIEW IF EXISTS public.public_products;

CREATE VIEW public.public_products AS
SELECT 
  id,
  name,
  description,
  excerpt,
  cover_image_url,
  preview_video_url,
  youtube_url,
  -- REMOVED: download_url - this is sensitive and should only be accessed via edge function
  original_filename,
  price_cents,
  currency,
  pricing_type,
  product_type,
  status,
  featured,
  locked,
  tags,
  benefits,
  attachments,
  duration_label,
  subscription_access,
  subscription_price_cents,
  slug,
  creator_id,
  created_at,
  updated_at
FROM public.products
WHERE status = 'published';

-- Grant access to the view
GRANT SELECT ON public.public_products TO anon, authenticated;

-- Add comment explaining the security design
COMMENT ON VIEW public.public_products IS 'Public-facing view of published products that excludes download_url. Use the get-download-url edge function to securely access download links after verifying purchase/subscription status.';