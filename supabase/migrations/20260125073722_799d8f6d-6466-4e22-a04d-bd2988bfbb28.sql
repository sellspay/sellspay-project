-- Recreate views with security_invoker=on to properly inherit caller's permissions
-- This is the recommended pattern per Supabase docs

-- Drop and recreate public_profiles with security_invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
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
WHERE (is_creator = true OR is_editor = true) AND (suspended IS NOT TRUE);

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Drop and recreate public_identities with security_invoker
DROP VIEW IF EXISTS public.public_identities;
CREATE VIEW public.public_identities
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  is_creator,
  is_editor,
  verified
FROM public.profiles
WHERE suspended IS NOT TRUE;

GRANT SELECT ON public.public_identities TO anon, authenticated;

-- Drop and recreate public_products with security_invoker
DROP VIEW IF EXISTS public.public_products;
CREATE VIEW public.public_products
WITH (security_invoker=on) AS
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