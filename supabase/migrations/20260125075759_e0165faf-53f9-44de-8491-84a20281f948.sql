-- =====================================================
-- Fix public_profiles view to be publicly accessible
-- The view only exposes non-sensitive data so it's safe
-- =====================================================

-- Recreate public_profiles as SECURITY DEFINER view (allows public access)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_barrier = true)
AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  banner_url,
  background_url,
  bio,
  website,
  social_links,
  is_creator,
  is_editor,
  verified,
  show_recent_uploads,
  editor_about,
  editor_city,
  editor_country,
  editor_hourly_rate_cents,
  editor_languages,
  editor_services,
  editor_social_links,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =====================================================
-- Fix public_identities view similarly
-- =====================================================
DROP VIEW IF EXISTS public.public_identities;

CREATE VIEW public.public_identities
WITH (security_barrier = true)
AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  verified,
  is_creator,
  is_editor
FROM public.profiles;

GRANT SELECT ON public.public_identities TO anon, authenticated;

-- =====================================================
-- Fix public_products view - only show published products
-- =====================================================
DROP VIEW IF EXISTS public.public_products;

CREATE VIEW public.public_products
WITH (security_barrier = true)
AS
SELECT 
  id,
  creator_id,
  name,
  slug,
  description,
  cover_image_url,
  preview_video_url,
  youtube_url,
  price_cents,
  currency,
  pricing_type,
  product_type,
  tags,
  featured,
  status,
  subscription_access,
  created_at,
  updated_at
FROM public.products
WHERE status = 'published';