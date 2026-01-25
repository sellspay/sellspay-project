-- Remove the dangerous public policy that exposes ALL profile columns
DROP POLICY IF EXISTS "Public can view creator and editor basic info via view" ON public.profiles;

-- Recreate public_profiles view with security_invoker = off
-- This allows the view to bypass RLS on profiles table while only exposing safe columns
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  bio,
  website,
  banner_url,
  background_url,
  is_creator,
  is_editor,
  verified,
  show_recent_uploads,
  social_links,
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
WHERE (is_creator = true) OR (is_editor = true);

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;