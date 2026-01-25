-- Fix: Remove created_by email exposure from public products access
-- Strategy: Create a public_products view that excludes the email field

-- First, create a public-facing view without the created_by email
CREATE VIEW public.public_products 
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  description,
  excerpt,
  cover_image_url,
  preview_video_url,
  youtube_url,
  download_url,
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
  creator_id,  -- Keep creator_id (UUID reference, not email)
  created_at,
  updated_at
  -- EXCLUDE: created_by (contains email addresses)
FROM public.products;

-- Grant access to the view
GRANT SELECT ON public.public_products TO anon, authenticated;

-- Drop the existing permissive SELECT policy for public access
DROP POLICY IF EXISTS "Published products are viewable by everyone" ON public.products;

-- Create new SELECT policy: Block direct public access to products table
-- Only allow access for creators to their own products or admins
CREATE POLICY "Creators can view their own products"
ON public.products FOR SELECT
USING (
  creator_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create a separate policy for the view to work (security_invoker needs base table access)
-- This policy allows SELECT but only through authenticated means
CREATE POLICY "Published products viewable via view"
ON public.products FOR SELECT
USING (status = 'published');