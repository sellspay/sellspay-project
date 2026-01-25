-- Fix SECURITY DEFINER views by converting them to SECURITY INVOKER
-- This ensures RLS policies of the querying user are applied, not the view creator

-- Recreate public_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
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
  editor_languages,
  editor_services,
  editor_hourly_rate_cents,
  editor_social_links,
  created_at,
  updated_at
FROM public.profiles
WHERE is_creator = true OR is_editor = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
COMMENT ON VIEW public.public_profiles IS 'Public-facing view of creator/editor profiles using SECURITY INVOKER for proper RLS enforcement.';

-- Recreate public_products view with SECURITY INVOKER  
DROP VIEW IF EXISTS public.public_products;
CREATE VIEW public.public_products
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  description,
  excerpt,
  cover_image_url,
  preview_video_url,
  youtube_url,
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

GRANT SELECT ON public.public_products TO anon, authenticated;
COMMENT ON VIEW public.public_products IS 'Public-facing view of published products using SECURITY INVOKER. Excludes download_url for security.';

-- Recreate public_identities view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_identities;
CREATE VIEW public.public_identities
WITH (security_invoker = true)
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
FROM public.public_identities_cache;

GRANT SELECT ON public.public_identities TO anon, authenticated;
COMMENT ON VIEW public.public_identities IS 'Public user identities view using SECURITY INVOKER for proper RLS enforcement.';