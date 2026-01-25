-- The security_invoker views won't work because profiles RLS blocks non-owners
-- Instead, we need to add a policy that allows reading only public-safe data
-- We'll use the public_identities_cache table which is designed for this purpose

-- First, revert views to non-security_invoker but ensure they only expose safe fields
-- These views are meant to bypass RLS to show public creator/product info

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
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
  -- EXPLICITLY EXCLUDES: email, phone, stripe_account_id, payoneer_*, resend_*, pending_email, etc.
FROM public.profiles
WHERE (is_creator = true OR is_editor = true) AND (suspended IS NOT TRUE);

GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP VIEW IF EXISTS public.public_identities;
CREATE VIEW public.public_identities AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  is_creator,
  is_editor,
  verified
  -- EXPLICITLY EXCLUDES: email, phone, all sensitive fields
FROM public.profiles
WHERE suspended IS NOT TRUE;

GRANT SELECT ON public.public_identities TO anon, authenticated;

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
  -- EXPLICITLY EXCLUDES: created_by (email), download_url, attachments, original_filename
FROM public.products
WHERE status = 'published';

GRANT SELECT ON public.public_products TO anon, authenticated;